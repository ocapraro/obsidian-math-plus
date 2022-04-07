const closeGroup = (str: string, d=1) => {
  let openCount = 1;
  let closeCount = 0;
  for (let i = 1; i < (str.length); i++) {
    const char = str.charAt(i);
    if((char==="{" && d>0)||((char==="}" && d<1))) {
      openCount+=1;
    }else if((char==="}" && d>0)||((char==="{" && d<1))) {
      closeCount+=1;
    }
    if(openCount === closeCount){
      return i
    }
  }
}

const formatOperator = (str: string, op: string, strFormat: Function) => {
  const ops = [...str.matchAll(new RegExp(op, 'gi'))].map(a => a.index);
  let capturedIndexes = [[0,0]];
  let formattedString = "";
  if (ops.length) {
    for (let s = 0; s < ops.length; s++) {
      const i = ops[s];
      if(i>0 && i<str.length) {
        let range1 = [i-1,i];
        let range2 = [i+1,i+2];
        if(str.charAt(i-1) === "}") {
          let flipString = [...str].reverse().join('');
          range1 = [(i-1-closeGroup(flipString.slice(flipString.length-i),0)),i];
        }
        if(str.charAt(i+1) === "{") {
          range2 = [i+1, i+2+closeGroup(str.slice(i+1))];
        }
        const currIndex = [range1[0],range2[1]];
        if (currIndex[0] != capturedIndexes[capturedIndexes.length-1][1]) {
          let missing = str.slice(capturedIndexes[capturedIndexes.length-1][1],currIndex[0]);
          missing = missing;
          formattedString+=missing;
        }
        capturedIndexes.push(currIndex);
        // Array.prototype.push.apply(capturedIndexes, currIndex);
        formattedString += strFormat(str.slice(range1[0],range1[1]),str.slice(range2[0],range2[1]))
      }
    }
    formattedString += str.slice(capturedIndexes[capturedIndexes.length-1][1]);
    return formattedString
  }
  return str
}

const formatGroups = (str: string) => {
  let formattedString = str.replace(/\)/g, ')}').replace(/\(/g, '{(');
  formattedString = formattedString.replace(/[0-9.][0-9.]+/ig, "{$&}");
  return formattedString
}

const addLines = (str: string) => {
  let formattedString = `\\begin{align*}&${str.replace(/\n/ig, "\\\\&")}\\end{align*}`;
  return formattedString
}

export const formatEquation = (str: string) => {
  let formattedString = formatGroups(str);
  console.log(formattedString);
  formattedString = formatOperator(formattedString, "\\^", (s1: string,s2: string)=>{return `{{${s1}}\^{${s2}}}`});
  console.log(formattedString);
  formattedString = formatOperator(formattedString, "/", (s1: string,s2: string)=>{return `\\frac{${s1}}{${s2}}`});
  formattedString = addLines(formattedString);


  return formattedString
}