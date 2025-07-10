import { IsString, validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { v4 } from "uuid";

const valid_search_params = ["since", "before", "classification", "dir", "by"];
const valid_sorts = ["submit_date"];

class BadRequestError extends Error {}
class NotFoundError extends Error {}
class UnauthorizedError extends Error {}

class UserTrashSubmission {
  userGuid: string;
  imageKey: string;
  rawAnalysis: string;
  classificationFirst: string;
  modelConfidenceFirst: number;
  classificationSecond?: string;
  modelConfidenceSecond?: number;
  classificationThird?: string;
  modelConfidenceThird?: number;
  xCoord4326: number;
  yCoord4326: number;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: any): Promise<any> {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/search") {
        return await search(request, env);
      } else if (url.pathname === "/initialize") {
        return await initialize(request, env);
      } else if (url.pathname === "/submit" && request.method === "POST") {
        return await submit(request, env);
      }
      throw new NotFoundError("Not Found");
    } catch (err) {
      console.error(err.message);
      const status =
        err instanceof BadRequestError
          ? 400
          : err instanceof NotFoundError
          ? 404
          : 500;
      return (Response as Record<string, any>).json(
        {
          error: err.message,
        },
        {
          status,
        }
      );
    }
  },
};

export default worker;

async function search(request: Request, env: Env) {
  validateRequestParams(request);
  const sql = generateSql(new URL(request.url).searchParams);
  const { results } = await env.DB.prepare(
    `SELECT * FROM litter_${env.ENV} ${sql}`
  )
    .bind()
    .all();
  return (Response as Record<string, any>).json({ results });
}

async function submit(request: Request, env: Env) {
  const url = new URL(request.url);
  const params = url.searchParams;
  if (params.get("key") !== env.SUBMIT_KEY) {
    throw new UnauthorizedError("Not Authorized");
  }
  const body: Record<string, any> = await request.json();
  const transformed: UserTrashSubmission = await plainToInstance(
    UserTrashSubmission,
    body
  );

  const errors = await validate(transformed, { forbidUnknownValues: false });
  if (errors.length) {
    throw new BadRequestError(
      `Invalid input: ${errors[0].toString()}`
    );
  }

  const res = await env.DB.prepare(
    `INSERT INTO litter_${env.ENV} VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);
`
  )
    .bind(
      v4(),
      transformed.userGuid,
      transformed.imageKey,
      Date.now(),
      transformed.rawAnalysis,
      transformed.classificationFirst,
      transformed.modelConfidenceFirst,
      transformed.classificationSecond || null,
      transformed.modelConfidenceSecond || null,
      transformed.classificationThird || null,
      transformed.modelConfidenceThird || null,
      transformed.xCoord4326,
      transformed.yCoord4326
    )
    .all();

  if (res.error) {
    throw new Error(`Server error: ${(res.error as Error).message}`);
  }

  return (Response as Record<string, any>).json({ success: true });
}

async function initialize(request: Request, env: Env) {
  const url = new URL(request.url);

  const db = env.DB;
  const deploymentEnv = env.ENV;
  const runningLocally = env.RUNNING_LOCALLY === "true";

  const params = url.searchParams;
  if (params.get("key") !== env.INITIALIZATION_KEY) {
    throw new UnauthorizedError("Not Authorized");
  }
  const res = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .bind()
    .all();
  const table_exists = res.results.find(
    (result) => result.name === `litter_${deploymentEnv}`
  );

  if (runningLocally) {
    if (table_exists) {
      await dropLitterTable(db, deploymentEnv);
    }
    await createLitterTable(db, deploymentEnv);
  } else if (!table_exists) {
    await createLitterTable(db, deploymentEnv);
  }

  return (Response as Record<string, any>).json(
    {
      success: true,
    },
    {
      status: 200,
    }
  );
}

async function createLitterTable(db: D1Database, env_name: string) {
  const createStatement = `
CREATE TABLE litter_${env_name} (
    guid text PRIMARY KEY,
    user_guid text NOT NULL,
    image_key text NOT NULL,
    submit_date numeric NOT NULL,
    raw_analysis text NOT NULL,
    classification_first text NOT NULL,
    model_confidence_first numeric NOT NULL,
    classification_second text,
    model_confidence_second numeric,
    classification_third text,
    model_confidence_third numeric,
    x_coord_4326 numeric NOT NULL,
    y_coord_4326 numeric NOT NULL
)
`;

  const res = await db.prepare(createStatement).bind().all();
  if (res.error) {
    throw new Error("Unexpected error creating table");
  }
}

async function dropLitterTable(db: D1Database, env_name: string) {
  const dropStatement = `
DROP TABLE litter_${env_name}
`;

  await db.prepare(dropStatement).bind().all();
}

function validateRequestParams(request: Request): void {
  const asUrl = new URL(request.url);
  const { pathname, searchParams } = asUrl;
  if (pathname !== "/search") {
    throw new NotFoundError("Not Found");
  }

  searchParams.forEach((param) => {
    if (!valid_search_params.includes(param.toLowerCase())) {
      throw new BadRequestError(`Provided param "${param}" is invalid`);
    }
  });

}

function generateSql(searchParams: URLSearchParams): string {
  const clauses = [];

  let before;
  let since;

  if (searchParams.has("before")) {
    before = new Date(searchParams.get("before"));
    if (!(before instanceof Date) || isNaN(before.valueOf())) {
      throw new BadRequestError('"before" must be a valid date');
    }
    clauses.push(`submit_date < ${before.getTime()}`);
  }

  if (searchParams.has("since")) {
    since = new Date(searchParams.get("since"));
    if (!(since instanceof Date) || isNaN(since.valueOf())) {
      throw new BadRequestError('"since" must be a valid date');
    }
    clauses.push(`submit_date > ${since.getTime()}`);
  }

  if (searchParams.has("classification")) {
    const classification = searchParams.get("classificiation");
    clauses.push(`
      (
        (classification_first = ${classification} AND model_confidence_first > 70) OR
        (classification_second = ${classification} AND model_confidence_second > 70) OR
        (classification_third = ${classification} AND model_confidence_third > 70)
    `);
  }

  const where = clauses.join(" AND ");

  const by = searchParams.get("by");
  const dir = searchParams.get("dir") || "desc";
  if (by && !valid_sorts.includes(by)) {
    throw new BadRequestError('invalid "by"');
  }
  if (dir && dir !== "asc" && dir !== "desc") {
    throw new BadRequestError('invalid "dir"');
  }

  if (by) {
    return `${where} ORDER BY ${by} ${dir}`;
  }
  return `${where} ORDER BY submit_date ${dir}`;
}
