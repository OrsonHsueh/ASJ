function parseParameter(strURL) {
  var paraString = strURL.substr(strURL.indexOf("?")+1, strURL.length);
  var tmpArr;
  var tmpPara = {};
  var arrPara = [];
  tmpArr = paraString.split("&");
  for (var i=0; i<tmpArr.length; i++) {
    tmpPara.Name = tmpArr[i].substr(0, tmpArr[i].indexOf("#"));
    tmpPara.Value = tmpArr[i].substr(tmpArr[i].indexOf("#")+1, tmpArr[i].length);
    arrPara.push(tmpPara);
  }
  return arrPara;
}

function getParaValue(arrParameter, ParaName) {
  for (var i = 0; i < arrParameter.length; i++) {
    if (arrParameter[i].Name == ParaName) {
      return arrParameter[i].Value;
    }
  }
}