function onOpen() {
  // Add a menu with some items, some separators, and a sub-menu.
  DocumentApp.getUi().createMenu('Headings tools')
  .addItem('auto number Headings', 'numberHeadingsAdd')
  .addItem('clear Headings numbers', 'numberHeadingsClear')
  .addToUi();
}

function numberHeadingsAdd(){
  numberHeadings(true);
}

function numberHeadingsClear(){
  numberHeadings(false);
}

function numberHeadings(add){

  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var p = doc.getParagraphs();
  var numbers = [0,0,0,0,0,0,0];
  for (var i in p) {
    var e = p[i];
    var eText = e.getText()+'';
    var eTypeString = e.getHeading()+'';
    if (!eTypeString.match(/Heading \d/)) {
      continue;
    }
    
    if(eText.trim === ''){
      continue;
    }

    if (add == true) {
      var patt = new RegExp(/Heading (\d)/);
      var eLevel = patt.exec(eTypeString)[1];
      var txt = '';

      numbers[eLevel]++;
      for (var l = 1; l<=6; l++) {
        if (l <= eLevel) {
          txt += numbers[l]+'.';
        } else {
          numbers[l] = 0;
        }
      }
      Logger.log(eText);
      var newText = txt+' '+eText.replace(/^[0-9\.\s]+/, '');
      e.setText(newText);
      Logger.log([newText]);
    } else {
      Logger.log(eText);
      var newText = eText.replace(/^[0-9\.\s]+/, '');
      e.setText(newText);
    }
  }

}
