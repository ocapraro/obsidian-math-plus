import React, { useEffect, useState, useRef, useCallback } from "react";
import Excalidraw, {
  exportToCanvas,
  exportToSvg,
  exportWithDarkMode,
  exportToBlob,
  serializeAsJSON
} from "@excalidraw/excalidraw";
import fs from "fs";
// import InitialData from "./initialData";
// import initialData from "./initialData";

const resolvablePromise = () => {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
};

const renderTopRightUI = () => {
  return (
    <button onClick={() => alert("This is dummy top right UI")}>
      {" "}
      Click me{" "}
    </button>
  );
};

const renderFooter = () => {
  return (
    <button onClick={() => alert("This is dummy footer")}>
      {" "}
      custom footer{" "}
    </button>
  );
};

let saveTimeout;

const saveData = (setInitialData, curData, id, saveToFile,closeDrawing=true,exportAsSvg=true) => {
  clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async() => {
    let formattedData = {...curData};
    formattedData.appState.collaborators = [];
    setInitialData(formattedData);
    localStorage.setItem(`excalidrawMathData-${id}`, JSON.stringify(formattedData));
    let lastId = localStorage.getItem("math-max-id");
    if (parseInt(lastId)<id){
      localStorage.setItem("math-max-id", id);
    }
    if(exportAsSvg){
      await exportSVG({...formattedData}, id, saveToFile,closeDrawing);
    }
  }, 500)
}


const exportSVG = async (data, id, saveToFile, closeDrawing=true) => {
  let canvas = document.getElementById(`math-canvas-${id}`);
  let formattedData = {...data};
  formattedData.appState.collaborators = [];
  formattedData.elements.unshift({
    "id": "8CNL550q56lrGZ4uWepQE",
    "type": "rectangle",
    "x": 1,
    "y": 1,
    "width": 10000,
    "height": canvas.offsetHeight,
    "angle": 0,
    "strokeColor": "transparent",
    "backgroundColor": "transparent",
    "fillStyle": "hachure",
    "strokeWidth": 1,
    "strokeStyle": "solid",
    "roughness": 1,
    "opacity": 100,
    "groupIds": [],
    "strokeSharpness": "sharp",
    "seed": 1059728569,
    "version": 211,
    "versionNonce": 1597954423,
    "isDeleted": false,
    "boundElements": null,
    "updated": 1649700340427,
    "link": null
  });
  const svg = await exportToSvg(formattedData);
  formattedData.elements.unshift();
  saveToFile("data-"+id+".svg",svg.outerHTML, closeDrawing);
}

export function ExcalidrawCanvas({ id, saveToFile }) {
  const excalidrawRef = useRef(null);
  const dimensionRef = useRef();
  const saveIntervalRef = useRef(null);
  const [InitialData, setInitialData] =  useState(localStorage.getItem(`excalidrawMathData-${id}`)?
  JSON.parse(localStorage.getItem(`excalidrawMathData-${id}`))
  :{
    elements: [],
    appState: { viewBackgroundColor: "#fff0", currentItemFontFamily: 1 },
    scrollToContent: false,
    libraryItems: []
  });

  const initialStatePromiseRef = useRef({ promise: null });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise = resolvablePromise();
  }
  useEffect(() => {
    initialStatePromiseRef.current.promise.resolve(InitialData);

    const onHashChange = () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const libraryUrl = hash.get("addLibrary");
      if (libraryUrl) {
        excalidrawRef.current.importLibrary(libraryUrl, hash.get("token"));
      }
    };
    window.addEventListener("hashchange", onHashChange, false);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      let curData = {
        elements: excalidrawRef.current.getSceneElements(),
        appState: excalidrawRef.current.getAppState(),
        scrollToContent: false,
        libraryItems: []
      };
      saveData(setInitialData, curData, id, saveToFile, false, false);
    }, 1000);
    return () => clearInterval(saveIntervalRef.current);
  }, []);


  const onLinkOpen = useCallback((element, event) => {
    const link = element.link;
    const { nativeEvent } = event.detail;
    const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
    const isNewWindow = nativeEvent.shiftKey;
    const isInternalLink =
      link.startsWith("/") || link.includes(window.location.origin);
    if (isInternalLink && !isNewTab && !isNewWindow) {
      // signal that we're handling the redirect ourselves
      event.preventDefault();
      // do a custom redirect, such as passing to react-router
      // ...
    }
  }, []);


  return (
    <div className="excalidraw-canvas"style={{
      fontFamily: "sans-serif",
      textAlign: "center",
      height: "100%"
    }}>
      <button className="math-save-button" onClick={async ()=>{
        let curData = {
          elements: excalidrawRef.current.getSceneElements(),
          appState: excalidrawRef.current.getAppState(),
          scrollToContent: false,
          libraryItems: []
        };
        saveData(setInitialData, curData, id, saveToFile);
        clearInterval(saveIntervalRef.current);
      }} style={{
        zIndex:5,
        position:"absolute",
        opacity: 0,
        transition: "opacity 300ms",
        left:"calc(50% + 20px)",
        transform: "translateX(-50%)",
        display:"none"
        }}>
        Save Drawing
      </button>
      <div
        style={{ height: "100%" }}
        onWheelCapture={(e) => {
          // Stop Excalidraw from hijacking scroll
          e.stopPropagation();
        }}
      >
        <div className={"excalidraw-wrapper"+(document.querySelector(`.math-block-${id}`).offsetHeight<350?" small-canvas":"")} id={`math-canvas-${id}`} ref={dimensionRef} style={{
          backgroundColor: "#fff0",
          opacity:0
        }}>
          <Excalidraw
            ref={excalidrawRef}
            initialData={InitialData}
            onCollabButtonClick={() =>
              window.alert("You clicked on collab button")
            }
            viewModeEnabled={false}
            zenModeEnabled={false}
            gridModeEnabled={false}
            theme={document.querySelector('body').hasClass("theme-light")?"light":"dark"}
            name="Custom name of drawing"
            UIOptions={{ canvasActions: { loadScene: false } }}
            renderTopRightUI={renderTopRightUI}
            renderFooter={renderFooter}
            onLinkOpen={onLinkOpen}
          />
        </div>
      </div>
    </div>
  );
}
