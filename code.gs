function onOpen() {
  DocumentApp.getUi().createMenu('Headings Tools')
  .addItem('Auto Number Headings', 'numberHeadingsAdd')
  .addItem('Clear Heading Numbers', 'numberHeadingsClear')
  .addToUi();
}

function numberHeadingsAdd(){
  numberHeadings(true);
}

function numberHeadingsClear(){
  numberHeadings(false);
}

function numberHeadings(add){
  var document = DocumentApp.getActiveDocument();
  var body = document.getBody();
  var paragraphs = document.getParagraphs();
  var numbers = [0,0,0,0,0,0,0];
  for (var i in paragraphs) {
    var element = paragraphs[i];
    var text = element.getText()+'';
    var type = element.getHeading()+'';
    
    // exclude everything but headings
    if (!type.match(/HEADING\d/)) {
      continue;
    }
    
    // exclude empty headings (e.g. page breaks generate these)
    if( text.match(/^\s*$/)){
      continue;
    }
    
    var numberingRegex = /^[0-9]+(\.[0-9]+)*\. /;

    if (add == true) {
      var level = new RegExp(/HEADING(\d)/).exec(type)[1];
      var numbering = '';
      
      numbers[level]++;
      for (var currentLevel = 1; currentLevel <= 6; currentLevel++) {
        if (currentLevel <= level) {
          numbering += numbers[currentLevel] + '.';
        } else {
          numbers[currentLevel] = 0;
        }
      }
      Logger.log(text);
      var newText = numbering + ' ' + text.replace(numberingRegex, '');
      element.setText(newText);
      Logger.log([newText]);
    } else {
      Logger.log(text);
      element.setText(text.replace(numberingRegex, ''));
    }
  }

}
