import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { useState } from "react";
import * as ReactDOM from "react-dom";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

export const renderCanvas = (container: any, id: number) => {
  // const setHeight=(a:any)=>{return a}
  ReactDOM.render(
    <ExcalidrawCanvas id={id}  />,
    container
  );
}
