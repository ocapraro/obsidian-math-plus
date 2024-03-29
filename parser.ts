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
      return i;
    }
  }
  // Returns -1 if it reaches end of string w/o closing
  return -1
}

const replaceAll= (str: string, find: string, replace: string) => {
	return str.replace(new RegExp(find, 'g'), replace);
}

const formatStrFormat = (format: string, s1:string, s2:string) => {
  let str = format;
  if (str.includes("%s1%")) {
    str = str.replace("%s1%",s1);
  }else{
    str = s1+str;
  }
  if (str.includes("%s2%")) {
    str = str.replace("%s2%",s2);
  }else{
    str = str+s2;
  }
  str = replaceAll(str, "%bs%","\\")
  return str
}

const formatOperator = (str: string, dirtyOp: string, strFormat: string) => {
  let substituteString = str;
  let substitutes = [];
  let id = 0;
  let op = replaceAll(dirtyOp, "%bs%","\\");
  if ((substituteString.split(op).length-1)>0){
    while (true) {
      // the ID of the subsititute string
      id += 1;
      // the index of the operator
      const i = substituteString.indexOf(op);
      if((i>0 && i<substituteString.length && ((substituteString.split(op).length-1)>0))) {
        if(id>100000){
          console.log("Too many operators/Bad while loop");
          break;
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
          formattedStr: formatStrFormat(strFormat,formatOperator(substituteString.slice(range1[0],range1[1]),op,strFormat),formatOperator(substituteString.slice(range2[0],range2[1]),op,strFormat))
        };
        substitutes.push(substitute);
        substituteString = substituteString.replace(substituteString.slice(range1[0],range2[1]),substitute.keyString);

      }else{
        break;
      }
    }
    while (true) {
      if((substituteString.split("%33o").length-1)>0){
        for (let i = 0; i < substitutes.length; i++) {
          const substitute = substitutes[i];
          substituteString = substituteString.replace(substitute.keyString,substitute.formattedStr);
        }
      }else{
        break;
      }
    }
    return substituteString;
  }else{
    return str;
  }
}

const handleSuperSubScripts = (str: string): string => {
  const singleMatch = str.match(/(\\?[A-Z0-9]+)[\^_]/i);
  const groupMatch = str.match(/\}[\^_]/i);
  let match = (singleMatch&&groupMatch)?((singleMatch.index<groupMatch.index)?singleMatch:groupMatch):(singleMatch||groupMatch);
  if (singleMatch && match == singleMatch) {
    let endex = match.index+match[0].length;
    if (str[endex] == "{"){
      endex += closeGroup(str.slice(endex));
    }
    if ("^_".includes(str[endex+1])){
      endex += 2;
    }
    if (str[endex] == "{"){
      endex += closeGroup(str.slice(endex));
    }
    if (str[endex]=="\\"){
      endex += str.slice(endex+1).match(/[a-z]+/i)[0].length;
    }
    return str.slice(0,match.index) + "{" + str.slice(match.index,endex+1) + "}" + handleSuperSubScripts(str.slice(endex+1));
  }
  if(groupMatch && match == groupMatch){
    let flipString = [...str].reverse().join("");
    let startIndex = match.index-closeGroup(flipString.slice(flipString.length-match.index),0);
    return (str.slice(0,startIndex) + handleSuperSubScripts("\\MATHPLUSPLACEHOLDER"+ str.slice(match.index+match[0].length-1))).replace("\\MATHPLUSPLACEHOLDER",str.slice(startIndex,match.index+match[0].length-1));
  }
  return str;
}

const formatGroups = (str: string) => {
  // Wrap parentheses in group tags
  let formattedString = str.replace(/\)/g, ')}').replace(/\(/g, '{(');
  // Wrap decimles in group tags
  formattedString = formattedString.replace(/[0-9.][0-9.]+/ig, "{$&}");
  // Wrap \infty in group tags
  formattedString = formattedString.replace(/\\infty/ig, "{$&}");
  // Wrap any expression raised to a power in group tags to avoid char separation
  formattedString = formattedString.replace(/(\\[A-Za-z]+)([\^_])/ig, "{$1}$2");
  // Wrap any long expressions in group tags
  // formattedString = formattedString.replace(/\\?[A-Za-z\{\}\(\)\[\]0-9]+[\^_][A-Za-z\{\}\(\)\[\]0-9]+[\^_]?[A-Za-z\{\}\(\)\[\]0-9]*/ig, "{$&}");
  formattedString = handleSuperSubScripts(formattedString);
  return formattedString;
}

const addLines = (str: string) => {
  // replaces new lines with \\ so that LaTex recognizes them
  let formattedString = `\\begin{align*}&${str.replace(/\n/ig, "\\\\&")}\\end{align*}`;
  return formattedString
}

export const formatEquation = (str: string, strOperators: string) => {
  const operators = JSON.parse(replaceAll(strOperators,"\\\\","%bs%"));
  let formattedString = " "+formatGroups(str);
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    formattedString = formatOperator(formattedString,op.op,op.format);
  }
  formattedString = addLines(formattedString);


  return formattedString
}