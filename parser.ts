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
  // Returns -1 if it reaches end of string w/o closing
  return -1
}

const formatOperator = (str: string, op: string, strFormat: Function) => {
  let substituteString = str;
  let substitutes = [];
  let id = 0;
  if ((substituteString.split(op).length-1)>0){
    while (true) {
      // the ID of the subsititute string
      id += 1;
      // the index of the operator
      const i = substituteString.indexOf(op);
      if((i>0 && i<substituteString.length && ((substituteString.split(op).length-1)>0))) {
        if(id>100000){
          console.log("Too many operators/Bad while loop");
          break
        }
        let range1 = [i-1,i];
        let range2 = [i+op.length,i+1+op.length];
        if(substituteString.charAt(i-1) === "}") {
          let flipString = [...substituteString].reverse().join('');
          range1 = [(i-1-closeGroup(flipString.slice(flipString.length-i),0)),i];
        }
        if(substituteString.charAt(i+op.length) === "{") {
          range2 = [i+op.length, i+1+op.length+closeGroup(substituteString.slice(i+op.length))];
        }
        let substitute = {
          keyString: `{%33o${id}%33c}`,
          formattedStr: strFormat(formatOperator(substituteString.slice(range1[0],range1[1]),op,strFormat),formatOperator(substituteString.slice(range2[0],range2[1]),op,strFormat))
        };
        substitutes.push(substitute);
        substituteString = substituteString.replace(substituteString.slice(range1[0],range2[1]),substitute.keyString);

      }else{
        break
      }
    }
    while (true) {
      if((substituteString.split("%33o").length-1)>0){
        for (let i = 0; i < substitutes.length; i++) {
          const substitute = substitutes[i];
          substituteString = substituteString.replace(substitute.keyString,substitute.formattedStr);
        }
      }else{
        break
      }
    }
    return substituteString
  }else{
    return str
  }
}

const formatGroups = (str: string) => {
  // Wrap parentheses in group tags
  let formattedString = str.replace(/\)/g, ')}').replace(/\(/g, '{(');
  // Wrap decimles in group tags
  formattedString = formattedString.replace(/[0-9.][0-9.]+/ig, "{$&}");
  // Wrap \infty in group tags
  formattedString = formattedString.replace(/\\infty/ig, "{$&}");
  return formattedString
}

const addLines = (str: string) => {
  let formattedString = `\\begin{align*}&${str.replace(/\n/ig, "\\\\&")}\\end{align*}`;
  return formattedString
}

export const formatEquation = (str: string) => {
  const operators = [
    {
      op:"\\if",
      format:(s1: string,s2: string)=>{return `${s1}{\\text{if }}${s2}`}
    },
    {
      op:"\\then",
      format:(s1: string,s2: string)=>{return `${s1}{\\text{then }}${s2}`}
    },
    {
      op:"\\or",
      format:(s1: string,s2: string)=>{return `${s1}{\\text{ or }}${s2}`}
    },
    {
      op:"^",
      format:(s1: string,s2: string)=>{return `{{${s1}}\^{${s2}}}`}
    },
    {
      op:"_",
      format:(s1: string,s2: string)=>{return `{{${s1}}_{${s2}}}`}
    },
    {
      op:"!",
      format:(s1: string,s2: string)=>{return `{${s1}!}${s2}`}
    },
    {
      op:"/",
      format:(s1: string,s2: string)=>{return `\\frac{${s1}}{${s2}}`}
    },
    {
      op:"\\lim",
      format:(s1: string,s2: string)=>{return `\\lim_{${s1}\\to${s2}}`}
    },
    {
      op:"\\su",
      format:(s1: string,s2: string)=>{return `\\sum\\limits_{${s2}}^{${s1}}`}
    },
    {
      op:"\\is",
      format:(s1: string,s2: string)=>{return `${s1}\\sum\\limits_{n=${s2}}^{\\infty}`}
    },
    {
      op:"\\abs",
      format:(s1: string,s2: string)=>{return `${s1}{|${s2}|}`}
    }
  ];
  let formattedString = " "+formatGroups(str);
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    formattedString = formatOperator(formattedString,op.op,op.format);
  }
  formattedString = addLines(formattedString);


  return formattedString
}