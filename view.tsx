import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

export const renderCanvas = (container: any, id: number) => {
  ReactDOM.render(
    <ExcalidrawCanvas id={id} />,
    container
  );
}
