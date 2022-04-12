import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { useState } from "react";
import * as ReactDOM from "react-dom";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";
import {createRoot} from 'react-dom/client';

export const renderCanvas = (container: any, id: number, saveToFile:any) => {
  // const setHeight=(a:any)=>{return a}
  let root = createRoot(container);
  root.render(
    <ExcalidrawCanvas id={id} saveToFile={saveToFile}  />
  );
}
