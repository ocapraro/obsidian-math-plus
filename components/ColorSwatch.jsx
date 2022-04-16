import React, { useEffect, useState, useRef, useCallback } from "react";

export const ColorSwatch = ({ color, currColor, onClick }) => {
  return (
      <div 
        className={`math-color-swatch${currColor===color?" selected":""}`} 
        style={{backgroundColor:color}} onClick={()=>{
          onClick();
        }}
      >
      </div>
  )
}