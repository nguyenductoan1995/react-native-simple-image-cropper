import React, { PureComponent, ReactNode } from 'react';
import { 
  // Image,
   Dimensions
   } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import ImageViewer from './ImageViewer';
 
import {
  getPercentFromNumber,
  getPercentDiffNumberFromNumber,
} from './helpers/percentCalculator';
import {
  ICropperParams,
  ICropParams,
  IImageViewerData,
  ISizeData,
} from './types';

interface IProps {
  imageUri: string;
  cropAreaWidth: number;
  cropAreaHeight: number;
  containerColor?: string;
  areaColor?: string;
  areaOverlay?: ReactNode;
  setCropperParams: (params: ICropperParams) => void;
  renderVideo?: any
  getSize?: any
}

export interface IState {
  positionX: number;
  positionY: number;
  scale: number;
  minScale: number;
  srcSize: ISizeData;
  fittedSize: ISizeData;
  width: number;
  height: number;
  loading: boolean;
  prevImageUri: string;
  cropAreaHeight: number;
}

const window = Dimensions.get('window');
const w = window.width;
const h = window.height;

const defaultProps = {
  cropAreaWidth: w,
  cropAreaHeight: w,
  containerColor: 'black',
  areaColor: 'black',
};

class ImageCropper extends PureComponent<IProps, IState> {
  static crop = (params: ICropParams): Promise<string | null | undefined> => {
    const {
      positionX,
      positionY,
      scale,
      srcSize,
      fittedSize,
      cropSize,
      cropAreaSize,
      imageUri,
    } = params;

    const offset = {
      x: 0,
      y: 0,
    };

    const cropAreaW = cropAreaSize ? cropAreaSize.width : w;
    const cropAreaH = cropAreaSize ? cropAreaSize.height : w;

    const wScale = cropAreaW / scale;
    const hScale = cropAreaH / scale;

    const percentCropperAreaW = getPercentDiffNumberFromNumber(
      wScale,
      fittedSize.width,
    );
    const percentRestW = 100 - percentCropperAreaW;
    const hiddenAreaW = getPercentFromNumber(percentRestW, fittedSize.width);

    const percentCropperAreaH = getPercentDiffNumberFromNumber(
      hScale,
      fittedSize.height,
    );
    const percentRestH = 100 - percentCropperAreaH;
    const hiddenAreaH = getPercentFromNumber(percentRestH, fittedSize.height);

    const x = hiddenAreaW / 2 - positionX;
    const y = hiddenAreaH / 2 - positionY;

    offset.x = x <= 0 ? 0 : x;
    offset.y = y <= 0 ? 0 : y;

    const srcPercentCropperAreaW = getPercentDiffNumberFromNumber(
      offset.x,
      fittedSize.width,
    );
    const srcPercentCropperAreaH = getPercentDiffNumberFromNumber(
      offset.y,
      fittedSize.height,
    );

    const offsetW = getPercentFromNumber(srcPercentCropperAreaW, srcSize.width);
    const offsetH = getPercentFromNumber(
      srcPercentCropperAreaH,
      srcSize.height,
    );

    const sizeW = getPercentFromNumber(percentCropperAreaW, srcSize.width);
    const sizeH = getPercentFromNumber(percentCropperAreaH, srcSize.height);

    offset.x = Math.floor(offsetW);
    offset.y = Math.floor(offsetH);

    const cropData = {
      offset,
      size: {
        width: Math.round(sizeW),
        height: Math.round(sizeH),
      },
      displaySize: {
        width: Math.round(cropSize.width),
        height: Math.round(cropSize.height),
      },
    };

    return new Promise((resolve, reject) =>
      ImageEditor.cropImage(imageUri, cropData)
        .then(resolve)
        .catch(reject),
    );
  };

  static defaultProps = defaultProps;

  static getDerivedStateFromProps(props: IProps, state: IState) {
    if (props.imageUri !== state.prevImageUri) {
      return {
        prevImageUri: props.imageUri,
        loading: true,
      };
    }
    if(props.cropAreaHeight !=state.cropAreaHeight) {
      return {
        cropAreaHeight: props.cropAreaHeight
      }
    }

    return null;
  }

  state = {
    positionX: 0,
    positionY: 0,
    width: 0,
    height: 0,
    scale: 1,
    minScale: 1,
    loading: true,
    srcSize: {
      width: 0,
      height: 0,
    },
    fittedSize: {
      width: 0,
      height: 0,
    },
    prevImageUri: '',
    cropAreaHeight: 0,
  };

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps: IProps) {
    const { imageUri,cropAreaHeight } = this.props;
    if (imageUri && prevProps.imageUri !== imageUri) {
      this.init();
    }
    if(prevProps.cropAreaHeight !== cropAreaHeight ) {
      this.onChangeCropSize(cropAreaHeight)
    }
  }

  onChangeCropSize = (newCrop= 0) =>{
    
     const { setCropperParams,cropAreaWidth } = this.props;
    const { fittedSize } = this.state;

     const scale = newCrop >= cropAreaWidth ? newCrop/fittedSize.width: w/fittedSize.width
  //   alert(scale)
  
    this.setState(
      prevState => ({
        ...prevState,
        minScale: scale,
        loading: false,
      }),
      () => {
        const { positionX, positionY, srcSize, fittedSize } = this.state;

        setCropperParams({
          positionX,
          positionY,
          scale,
          srcSize,
          fittedSize,
        });
      },
    );
  }

  init = () => {
    const { imageUri,getSize } = this.props;
   getSize(
      imageUri,
      (width = 0, height= 0) => {
        const { setCropperParams, cropAreaWidth, cropAreaHeight } = this.props;

        const areaWidth = cropAreaWidth!;
        const areaHeight = cropAreaHeight!;

        const srcSize = { width, height };
        const fittedSize = { width: 0, height: 0 };
        let scale = 1;

        if (width > height) {
          const ratio = w / width;
          fittedSize.width = width * ratio;
          fittedSize.height = height* ratio;
        } else if (width < height) {
          const ratio = h / height;
          fittedSize.width = width*ratio;
          fittedSize.height = height * ratio;
        } else if (width === height) {
          fittedSize.width = w;
          fittedSize.height = w;
        }

        if (areaWidth < areaHeight || areaWidth === areaHeight) {
          if (width < height) {
            if (fittedSize.height < areaHeight) {
              scale =(areaHeight / fittedSize.height) ;
            } else {
              scale = (areaWidth / fittedSize.width);
            }
          } else {
            scale = (areaHeight / fittedSize.height) 
          }
        } else {
          if (width > height) {
            if (fittedSize.height < areaHeight) {
              scale =(areaHeight / fittedSize.height) ;
            } else {
              scale = (areaWidth / fittedSize.width);
            }
          } else {
            scale = (areaHeight / fittedSize.height) 
          }
        }

        scale = scale < 1 ? 1 : scale;

        this.setState(
          prevState => ({
            ...prevState,
            srcSize,
            fittedSize,
            minScale: scale,
            loading: false,
          }),
          () => {
            const { positionX, positionY } = this.state;

            setCropperParams({
              positionX,
              positionY,
              scale,
              srcSize,
              fittedSize,
            });
          },
        );
      },
      () => {},
    );
    // Image.getSize(
    //   imageUri,
    //   (width, height) => {
    //     const { setCropperParams, cropAreaWidth, cropAreaHeight } = this.props;

    //     const areaWidth = cropAreaWidth!;
    //     const areaHeight = cropAreaHeight!;

    //     const srcSize = { width, height };
    //     const fittedSize = { width: 0, height: 0 };
    //     let scale = 1;

    //     if (width > height) {
    //       const ratio = w / height;
    //       fittedSize.width = width * ratio;
    //       fittedSize.height = w;
    //     } else if (width < height) {
    //       const ratio = w / width;
    //       fittedSize.width = w;
    //       fittedSize.height = height * ratio;
    //     } else if (width === height) {
    //       fittedSize.width = w;
    //       fittedSize.height = w;
    //     }

    //     if (areaWidth < areaHeight || areaWidth === areaHeight) {
    //       if (width < height) {
    //         if (fittedSize.height < areaHeight) {
    //           scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
    //         } else {
    //           scale = Math.ceil((areaWidth / fittedSize.width) * 10) / 10;
    //         }
    //       } else {
    //         scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
    //       }
    //     }

    //     scale = scale < 1 ? 1 : scale;

    //     this.setState(
    //       prevState => ({
    //         ...prevState,
    //         srcSize,
    //         fittedSize,
    //         minScale: scale,
    //         loading: false,
    //       }),
    //       () => {
    //         const { positionX, positionY } = this.state;

    //         setCropperParams({
    //           positionX,
    //           positionY,
    //           scale,
    //           srcSize,
    //           fittedSize,
    //         });
    //       },
    //     );
    //   },
    //   () => {},
    // );
  };

  // getSizeVideo({width= 0, height=0}) {
  //   const { setCropperParams, cropAreaWidth, cropAreaHeight } = this.props;

  //   const areaWidth = cropAreaWidth!;
  //   const areaHeight = cropAreaHeight!;

  //   const srcSize = { width, height };
  //   const fittedSize = { width: 0, height: 0 };
  //   let scale = 1;

  //   if (width > height) {
  //     const ratio = w / height;
  //     fittedSize.width = width * ratio;
  //     fittedSize.height = w;
  //   } else if (width < height) {
  //     const ratio = w / width;
  //     fittedSize.width = w;
  //     fittedSize.height = height * ratio;
  //   } else if (width === height) {
  //     fittedSize.width = w;
  //     fittedSize.height = w;
  //   }

  //   if (areaWidth < areaHeight || areaWidth === areaHeight) {
  //     if (width < height) {
  //       if (fittedSize.height < areaHeight) {
  //         scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
  //       } else {
  //         scale = Math.ceil((areaWidth / fittedSize.width) * 10) / 10;
  //       }
  //     } else {
  //       scale = Math.ceil((areaHeight / fittedSize.height) * 10) / 10;
  //     }
  //   }

  //   scale = scale < 1 ? 1 : scale;

  //   this.setState(
  //     prevState => ({
  //       ...prevState,
  //       srcSize,
  //       fittedSize,
  //       minScale: scale,
  //       loading: false,
  //     }),
  //     () => {
  //       const { positionX, positionY } = this.state;

  //       setCropperParams({
  //         positionX,
  //         positionY,
  //         scale,
  //         srcSize,
  //         fittedSize,
  //       });
  //     },
  //   );
  // }

  handleMove = ({ positionX, positionY, scale }: IImageViewerData) => {
    const { setCropperParams } = this.props;

    this.setState(
      prevState => ({
        ...prevState,
        positionX,
        positionY,
        scale,
      }),
      () => {
        const { srcSize, fittedSize } = this.state;

        setCropperParams({
          positionX,
          positionY,
          scale,
          srcSize,
          fittedSize,
        });
      },
    );
  };

  render() {
    const { loading, fittedSize, minScale } = this.state;
    const {
      imageUri,
      cropAreaWidth,
      cropAreaHeight,
      containerColor,
      areaColor,
      areaOverlay,
      renderVideo
    } = this.props;

    const areaWidth = cropAreaWidth!;
    const areaHeight = cropAreaHeight!;

    const imageWidth = fittedSize.width;
    const imageHeight = fittedSize.height;

    return !loading ? (
      <ImageViewer
        image={imageUri}
        areaWidth={areaWidth}
        areaHeight={areaHeight}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        minScale={minScale}
        onMove={this.handleMove}
        containerColor={containerColor}
        imageBackdropColor={areaColor}
        overlay={areaOverlay}
        renderVideo={renderVideo}
      />
    ) : null;
  }
}

export default ImageCropper;
