export class RoadFeature {
  protected _attributes: Record<string, any>;
  protected _geometry: Record<string, any>;

  protected constructor(attributes = {}, geometry = {}) {
    this._attributes = attributes;
    this._geometry = geometry;
  };

  public static builder() {
    return new RoadFeatureBuilder();
  }

  public getAttributes() {
    return this._attributes;
  }

  public getGeometry() {
    return this._geometry;
  }
};

class RoadFeatureBuilder extends RoadFeature {
  public geometry(geometry): RoadFeatureBuilder {
    this._geometry = geometry;
    return this;
  }

  public attributes(attributes): RoadFeatureBuilder {
    this._attributes = attributes;
    return this;
  }

  public build(): Record<string, any> {
    return {
      geometry: this._geometry,
      attributes: this._attributes,
    };
  }
}
