import { PureComponent, ReactNode } from 'react';
import { ICropperParams, ICropParams, IImageViewerData, ISizeData } from './types';
interface IProps {
    imageUri: string;
    cropAreaWidth: number;
    cropAreaHeight: number;
    containerColor?: string;
    areaColor?: string;
    areaOverlay?: ReactNode;
    setCropperParams: (params: ICropperParams) => void;
    renderVideo?: any;
    getSize?: any;
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
declare class ImageCropper extends PureComponent<IProps, IState> {
    static crop: (params: ICropParams) => Promise<string | null | undefined>;
    static defaultProps: {
        cropAreaWidth: number;
        cropAreaHeight: number;
        containerColor: string;
        areaColor: string;
    };
    static getDerivedStateFromProps(props: IProps, state: IState): {
        prevImageUri: string;
        loading: boolean;
        cropAreaHeight?: undefined;
    } | {
        cropAreaHeight: number;
        prevImageUri?: undefined;
        loading?: undefined;
    } | null;
    state: {
        positionX: number;
        positionY: number;
        width: number;
        height: number;
        scale: number;
        minScale: number;
        loading: boolean;
        srcSize: {
            width: number;
            height: number;
        };
        fittedSize: {
            width: number;
            height: number;
        };
        prevImageUri: string;
        cropAreaHeight: number;
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: IProps): void;
    onChangeCropSize: (newCrop?: number) => void;
    init: () => void;
    handleMove: ({ positionX, positionY, scale }: IImageViewerData) => void;
    render(): JSX.Element | null;
}
export default ImageCropper;
