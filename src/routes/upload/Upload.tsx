import React from 'react';
import { v4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { S3ClientService } from '../../services/s3-client-service';
import { AuthenticatorService } from '../../services/authenticator-service';

import './Upload.css';
import { ProtectedRoute } from '../hoc/protected-route-hoc';

class UnprotectedUpload extends React.Component<any, any> {
  private s3: S3Client = null;
  private hasRequiredPermissions: boolean = false;
  private geolocationRefresher: any = null;
  private geolocation: GeolocationPosition;
  private userAgent: string = null;

  constructor(props: any) {
    super(props);
    this.state = {
      submitting: false,
      submitError: false,
      submitMessage: '',
    };
  }

  // Lifecycle Functions
  async componentDidMount() {
    try {
      await this.getMobileDevicePermissions();
    } catch (err) {
      console.error(
        `error-getting-mobile-device-permissions: ${(err as Error).message}`
      );
      return;
    }

    try {
      await this.getGeolocationPermission();
    } catch (err) {
      console.error(
        `error-getting-geolocation-permissions: ${(err as Error).message}`
      );
      return;
    }

    try {
      await this.instantiateS3Client();
    } catch (err) {
      console.error(`error-creating-s3-client: ${(err as Error).message}`);
      return;
    }

    this.hasRequiredPermissions = true;
    this.geolocationRefresher = this.setupGeolocationRefresher();
    this.userAgent = navigator.userAgent;
  }

  componentWillUnmount() {
    if (this.geolocationRefresher) {
      clearTimeout(this.geolocationRefresher);
    }
  }

  // Setup Helpers
  private async getMobileDevicePermissions() {
    return;

    // try {
    //   await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // } catch (err) {
    //   console.error(`error-getting-user-media: ${(err as Error).message}`);
    //   throw err;
    // }

    // try {
    //   const devices = await navigator.mediaDevices.enumerateDevices();
    //   const deviceLabels = devices.map(device => device.label);
    //   const isMobileDevice = Object.keys(
    //     deviceLabels.filter(
    //       label => label.toLowerCase().includes('facing front') || label.toLowerCase().includes('facing back')
    //     ).reduce((labels: Record<string, any>, label) => {
    //       if (label.toLowerCase().includes('facing front')) labels['facing front'] = true;
    //       else if (label.toLowerCase().includes('facing back')) labels['facing back'] = true;
    //       return labels;
    //     }, {})
    //   ).length >= 2;
    //   if (!isMobileDevice) {
    //     throw new Error('error-using-non-mobile-device');
    //   }
    // } catch (err) {
    //   console.error(`error-enumerating-and-parsing-devices: ${(err as Error).message}`);
    //   throw err;
    // }
  }

  private async getGeolocationPermission() {
    return new Promise((resolve, reject) => {
      if (!this.hasRequiredPermissions) {
        navigator.geolocation.getCurrentPosition(
          (geolocation) => {
            this.geolocation = geolocation;
            resolve('successful');
          },
          (err) => {
            reject(err);
          }
        );
      }
    });
  }

  private async instantiateS3Client() {
    this.s3 = await S3ClientService.getClient();
  }

  private setupGeolocationRefresher(): any {
    return setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (geolocation) => {
          this.geolocation = geolocation;
          this.geolocationRefresher = this.setupGeolocationRefresher();
        },
        (err) => {
          console.error(err);
          this.geolocationRefresher = this.setupGeolocationRefresher();
        }
      );
    }, 10000);
  }

  private async handlePhoto() {
    const imageUploadEl = document.getElementById('ada-image-upload');
    if (imageUploadEl) {
      const file = (imageUploadEl as any)?.files[0];
      if (file) {
        const { user } = await AuthenticatorService.getCredentials();
        const ext = (file.name as string).match(/\.\w+$/g);
        const guid = v4();

        try {
          this.setState({ submitting: true, submitError: false, submitMessage: '' });
          await this.s3.send(
            new PutObjectCommand({
              Bucket: process.env.REACT_APP_SUBMISSIONS_BUCKET_NAME,
              Key: `${guid}${ext}`,
              Body: file,
              Metadata: {
                guid,
                userguid: user?.attributes?.sub,
                latitude: this.geolocation?.coords?.latitude
                  ? this.geolocation.coords.latitude.toString()
                  : null,
                longitude: this.geolocation?.coords?.longitude
                  ? this.geolocation.coords.longitude.toString()
                  : null,
                userAgent: this.userAgent,
              },
            })
          );
          this.setState({
            submitting: false,
            submitError: false,
            submitMessage: 'Photo successfully submitted!'
          });
        } catch (err) {
          this.setState({
            submitting: false,
            submitError: true,
            submitMessage: 'Something went wrong when submitting!'
          });
        }
      }
    }
  }

  render() {
    return (
      <div className='route-layout' id='ada-upload'>
        {this.state.submitting ? <Spinner size='sm' className='ada-upload-loader' /> : null }
        <Button id='upload-button'>
          <label htmlFor='ada-image-upload'>Submit an Image!</label>
        </Button>
        <input
          id='ada-image-upload'
          type='file'
          accept='image/*'
          capture='environment'
          onChange={async () => await this.handlePhoto()}
          onClick={async () => await this.getGeolocationPermission()}
        />
        <div className='ada-upload-message-container'>
          <div className={`ada-upload-message ${this.state.submitError ? 'submit-error' : ''}`}>{this.state.submitMessage}</div>
        </div>
      </div>
    );
  }
}

export const Upload = ProtectedRoute(UnprotectedUpload, '/upload');
