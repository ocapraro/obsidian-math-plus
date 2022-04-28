import * as React from "react";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";
import {createRoot} from 'react-dom/client';

export const renderCanvas = (container: any, id: number, saveToFile:any, gridModeEndabled:boolean, colors:Array<string>, readFile:any,prevData:string) => {
  let root = createRoot(container);
  root.render(
    <ExcalidrawCanvas id={id} root={root} saveToFile={saveToFile} gridMode={gridModeEndabled} colors={colors} readFile={readFile} prevData={prevData}  />
  );
}
