/**
 * @OnlyCurrentDoc
 */
function onOpen() {
  DocumentApp.getUi().createMenu('Headings Tools')
    .addItem('Auto Number Headings', 'numberHeadingsAdd')
    .addItem('Clear Heading Numbers', 'numberHeadingsClear')
    .addItem('Promote Headings (H1➡Title ... H6➡H5)', 'increaseHeadingLevels')
    .addItem('Demote Headings (Title➡Title, H1➡H2 ... H6➡Normal)', 'decreaseHeadingLevels')
    .addToUi();
}

function numberHeadingsAdd() {
  numberHeadings(true);
}

function numberHeadingsClear() {
  numberHeadings(false); DocumentApp.Attribute.HEADING
}

function numberHeadings(add) {
  let document = DocumentApp.getActiveDocument();
  let paragraphs = document.getParagraphs();
  let numbers = [0, 0, 0, 0, 0, 0, 0];
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

    element.replaceText("^[0-9\\.\\s]+", "")

    if (add == true) {
      let level = new RegExp(/HEADING(\d)/).exec(type)[1];
      let numbering = '';

      numbers[level]++;
      for (let currentLevel = 1; currentLevel <= 6; currentLevel++) {
        if (currentLevel <= level) {
          numbering += numbers[currentLevel] + '.';
        } else {
          numbers[currentLevel] = 0;
        }
      }
      element.insertText(0, numbering + ' ')
    }
  }

}

function changeHeadingLevels(direction) {
  let body = DocumentApp.getActiveDocument().getBody()
  let paragraphs = body.getParagraphs();
  for (let i in paragraphs) {
    let current_paragraph = paragraphs[i];
    let text = current_paragraph.getText() + '';
    let type = current_paragraph.getHeading() + '';

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

    let newHeadingLevel = eval("DocumentApp.ParagraphHeading.HEADING" + newLevel)
    if (currentLevel == problemCurrentLevel) {
      newHeadingLevel = eval("DocumentApp.ParagraphHeading." + problemLevelFix)
    }
    let style = {};
    style[DocumentApp.Attribute.HEADING] = newHeadingLevel

    let curr_para_id = body.getChildIndex(current_paragraph)
    let new_paragraph = current_paragraph.copy().setText(" ")
    body.insertParagraph(curr_para_id + 1, new_paragraph).setAttributes(style).merge()

    // current_paragraph.setAttributes(style)
  }


}

function increaseHeadingLevels() {
  changeHeadingLevels("up")
}

function decreaseHeadingLevels() {
  changeHeadingLevels("down")
}
