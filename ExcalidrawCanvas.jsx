import React, { useEffect, useState, useRef, useCallback } from "react";
import Excalidraw, { exportToSvg } from "@excalidraw/excalidraw";
import { ColorSwatch } from "./components/ColorSwatch"

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

const saveData = async (setInitialData, curData, id, saveToFile,closeDrawing=true,exportAsSvg=true) => {
  let formattedData = {...curData};
  formattedData.appState.collaborators = [];
  setInitialData((data)=>{
    formattedData.appState.currentItemStrokeColor = data.appState.currentItemStrokeColor;
    return formattedData
  });
  localStorage.setItem(`excalidrawMathData-${id}`, JSON.stringify(formattedData));
  let lastId = localStorage.getItem("math-max-id");
  if (parseInt(lastId)<id){
    localStorage.setItem("math-max-id", id);
  }
  if(exportAsSvg){
    await exportSVG({...formattedData}, id, saveToFile,closeDrawing);
  }
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
    "height": canvas?canvas.offsetHeight:1,
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

export function ExcalidrawCanvas({ id, saveToFile, gridMode, colors }) {
  const excalidrawRef = useRef(null);
  const dimensionRef = useRef();
  const saveIntervalRef = useRef(null);
  const [InitialData, setInitialData] =  useState(localStorage.getItem(`excalidrawMathData-${id}`)?
  JSON.parse(localStorage.getItem(`excalidrawMathData-${id}`))
  :{
    elements: [],
    appState: { viewBackgroundColor: "#fff0", currentItemFontFamily: 1, currentItemStrokeColor:"#000" },
    scrollToContent: false,
    libraryItems: []
  });

  let canvas = document.getElementById(`math-canvas-${id}`);
  let mathBlock = document.querySelector(`.math-block-${id}`);

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
      // auto save
      if(document.querySelector(`.math-block-${id}`)){
        saveData(setInitialData, curData, id, saveToFile, false, false);
      }else{
        saveData(setInitialData, curData, id, saveToFile, true, true);
        clearInterval(saveIntervalRef.current);
      }
    }, 1000);
    return () => clearInterval(saveIntervalRef.current);
  }, []);

  useEffect(()=>{
    if(excalidrawRef.current){
      excalidrawRef.current.updateScene(InitialData);
      window.dispatchEvent(new Event("resize"));
    }
  },[InitialData]);


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

  const switchColor = async (color)=>{
    let appState = excalidrawRef.current.getAppState();
    let elements = excalidrawRef.current.getSceneElements();
    let selectedIds = Object.keys(appState.selectedElementIds);
    let canvas = document.getElementById(`math-canvas-${id}`);
    let finalData;
    if(canvas){
      for (let i = 0; i < selectedIds.length; i++) {
        let selectedElement = elements.find(elem => (elem.id===selectedIds[i]));
        if(selectedElement){
          let selectedElementIndex = elements.indexOf(selectedElement);
          setInitialData((data)=>{
            let formattedData = {elements:[...elements],appState:{...appState}};
            formattedData.elements[selectedElementIndex].strokeColor=color;
            formattedData.appState.currentItemStrokeColor = color;
            finalData = formattedData
            return formattedData;
          });
        }
      }
      if(selectedIds.length<2){
        setInitialData((data)=>{
          let formattedData = {elements:[...elements],appState:{...appState}};
          formattedData.appState.currentItemStrokeColor = color;
          return formattedData;
        });
      }
    }
  }


  return (
    <div className="excalidraw-canvas"style={{
      fontFamily: "sans-serif",
      textAlign: "center",
      height: "100%"
    }}onClick={(e)=>{
      if(!e.target.hasClass("ToolIcon_type_radio")) {
        let appState = excalidrawRef.current.getAppState();
        let elements = excalidrawRef.current.getSceneElements();
        let selectedIds = Object.keys(appState.selectedElementIds);
        let canvas = document.getElementById(`math-canvas-${id}`);
        if(canvas){
          if (selectedIds.length>1){
            let selectedElement = elements.find(elem => (elem.id===selectedIds[0]));
            if(selectedElement){
              let selectedElementIndex = elements.indexOf(selectedElement);
              setInitialData((data)=>{
                let formattedData = {elements:[...elements],appState:{...appState}};
                formattedData.appState.currentItemStrokeColor = formattedData.elements[selectedElementIndex].strokeColor;
                return formattedData;
              });
            }
          }
        }
      }
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
        <div className={"excalidraw-wrapper"+(mathBlock?(mathBlock.offsetHeight<350?" small-canvas":""):"")} id={`math-canvas-${id}`} ref={dimensionRef} style={{
          backgroundColor: "#fff0",
          opacity:0
        }}>
          <div className="math-color-box">
            <div className="math-pill" onClick={()=>{
              canvas.querySelector(".math-color-box").classList.toggle("minimized");
            }}></div>
            <ColorSwatch 
              color={colors[0]} 
              currColor={InitialData.appState.currentItemStrokeColor}
              onClick={()=>{
                switchColor(colors[0]);
              }}
            />
            <ColorSwatch
              color={colors[1]}
              currColor={InitialData.appState.currentItemStrokeColor}
              onClick={()=>{
                switchColor(colors[1]);
              }}
            />
            <ColorSwatch 
              color={colors[2]} 
              currColor={InitialData.appState.currentItemStrokeColor}
              onClick={()=>{
                switchColor(colors[2]);
              }}
            />
          </div>
          <Excalidraw
            ref={excalidrawRef}
            initialData={InitialData}
            onCollabButtonClick={() =>
              window.alert("You clicked on collab button")
            }
            viewModeEnabled={false}
            zenModeEnabled={false}
            gridModeEnabled={gridMode}
            theme={document.querySelector('body').hasClass("theme-light")?"light":"dark"}
            name="Obsidian Math Plus Drawing"
            UIOptions={{ canvasActions: { loadScene: false } }}
            onLinkOpen={onLinkOpen}
          />
        </div>
      </div>
    </div>
  );
}
