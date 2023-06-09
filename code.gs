/**
 * @OnlyCurrentDoc
 */
function onOpen() {
  DocumentApp.getUi().createMenu('Headings Tools')
    .addItem('Auto Number Headings', 'numberHeadingsAdd')
    .addItem('Clear Heading Numbers', 'numberHeadingsClear')
    .addItem('Increase Heading Levels', 'increaseHeadingLevels')
    .addItem('Decrease Heading Levels', 'decreaseHeadingLevels')
    .addToUi();
}

function numberHeadingsAdd() {
  numberHeadings(true);
}

function numberHeadingsClear() {
  numberHeadings(false);
}

function numberHeadings(add) {
  var document = DocumentApp.getActiveDocument();
  var paragraphs = document.getParagraphs();
  var numbers = [0, 0, 0, 0, 0, 0, 0];
  for (var i in paragraphs) {
    var element = paragraphs[i];
    var text = element.getText() + '';
    var type = element.getHeading() + '';

    // exclude everything but headings
    if (!type.match(/HEADING\d/)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }

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
      var newText = numbering + ' ' + text.replace(/^[0-9\.\s]+/, '');
      element.setText(newText);
      Logger.log([newText]);
    } else {
      Logger.log(text);
      element.setText(text.replace(/^[0-9\.\s]+/, ''));
    }
  }

}

function changeHeadingLevels(direction) {
  let document = DocumentApp.getActiveDocument();
  let paragraphs = document.getParagraphs();
  for (let i in paragraphs) {
    let element = paragraphs[i];
    let text = element.getText() + '';
    let type = element.getHeading() + '';

    // exclude everything but headings
    if (!type.match(/HEADING\d/)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }
    console.log(type)

    // as integer
    let currentLevel = new RegExp(/HEADING(\d)/).exec(type)[1] * 1;
    let problemCurrentLevel = 6
    let newLevel = currentLevel + 1
    let problemLevelFix = "NORMAL"

    if (direction == "up") {
      problemCurrentLevel = 1
      newLevel = currentLevel - 1
      problemLevelFix = "TITLE"
    }

    if (currentLevel == problemCurrentLevel) {
      element.setHeading(eval("DocumentApp.ParagraphHeading." + problemLevelFix))
    } else {
      element.setHeading(eval("DocumentApp.ParagraphHeading.HEADING" + newLevel))
    }
  }
}

function increaseHeadingLevels() {
  changeHeadingLevels("up")
}

function decreaseHeadingLevels() {
  changeHeadingLevels("down")
}
