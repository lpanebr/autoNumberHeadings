/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Start', 'showSidebar')
    .addToUi();

  DocumentApp.getUi().createMenu('Heading Tools')
    .addItem('Add Headings Numbers', 'numberHeadingsAdd')
    .addItem('Remove Heading Numbers', 'numberHeadingsRemove')
    .addSeparator()
    .addItem('Promote Headings (H1➙Title ... H6➙H5)', 'increaseHeadingLevels')
    .addItem('Demote Headings (Title➙Title, H1➙H2 ... H6➙Normal)', 'decreaseHeadingLevels')

    .addToUi();

}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Auto number headings');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * 
 * ////////////////////////////////////////////////////////////////////////////
 *                            MY FUNCTIONS
 * ////////////////////////////////////////////////////////////////////////////
 */

function numberHeadingsAdd() {
  numberHeadings(true);
}
function numberHeadingsRemove() {
  numberHeadings(false);
}
function increaseHeadingLevels() {
  changeHeadingLevels("up")
}
function decreaseHeadingLevels() {
  changeHeadingLevels("down")
}


/**
 * Gets the user options and calls the required function to process headings
 *
 * @param {string} action The single word description of the action to perform.
 * @param {boolean} skipHeadings Whether to process all or only on some levels.
 * @param {boolean} savePrefs Whether to save the current options.
 * @return {Object} Not implemented: Object containing the resulting text and the result of the
 *     operation (success or error).
 */
function processHeadings(action, skipHeadings, skippedLevels, savePrefs) {
  if (savePrefs) {
    if (skippedLevels.match(/^[1-6,; e and y-]+$/) == null)
      return false

    skippedLevels = skippedLevels.replace(/\D/g, '')

    PropertiesService.getUserProperties()
      .setProperty('action', action)
      .setProperty('skipHeadings', skipHeadings)
      .setProperty('skippedLevels', skippedLevels);
  }

  let result
  switch (action) {
    case 'promote':
      // 
      result = changeHeadingLevels("up", skipHeadings, skippedLevels);
      break

    case 'demote':
      // 
      result = changeHeadingLevels("down", skipHeadings, skippedLevels);
      break

    case 'remove':
      // 
      result = numberHeadings(false, skipHeadings, skippedLevels);
      break

    default:
      //
      result = numberHeadings(true, skipHeadings, skippedLevels);
      break
  }
  // const text = getSelectedText().join('\n');
  return result;
}


function numberHeadings(add = false, skipHeadings = false, skippedLevels) {
  let document = DocumentApp.getActiveDocument();
  let paragraphs = document.getParagraphs();
  let numbers = [0, 0, 0, 0, 0, 0, 0];
  let headingsToProcessRegex = /HEADING\d/
  let before = []
  let after = []

  if (skipHeadings) {
    headingsToProcessRegex = eval('/HEADING[' + skippedLevels + ']/')
  }

  for (let i in paragraphs) {
    let element = paragraphs[i];
    let text = element.getText() + '';
    let type = element.getHeading() + '';

    // exclude everything but headings
    if (!type.match(headingsToProcessRegex)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }

    before.push(element.getText())
    element.replaceText("^[0-9]+(\\.[0-9]+)*\\. ", "")

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
    after.push(element.getText())
  }

  return {
    before: before.join("\n"),
    after: after.join("\n")
  }
}

function changeHeadingLevels(direction = '', skipHeadings = false, skippedLevels) {
  let body = DocumentApp.getActiveDocument().getBody()
  let paragraphs = body.getParagraphs();
  let headingsToProcessRegex = /HEADING\d/
  let before = []
  let after = []

  if (skipHeadings) {
    headingsToProcessRegex = eval('/HEADING[' + skippedLevels + ']/')
  }

  let inserted_paragraph
  for (let i in paragraphs) {
    let current_paragraph = paragraphs[i];
    let text = current_paragraph.getText() + '';
    let type = current_paragraph.getHeading() + '';

    // exclude everything but headings
    if (!type.match(headingsToProcessRegex)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }
    console.log(type)

    before.push(current_paragraph.getText())

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
    inserted_paragraph = body.insertParagraph(curr_para_id + 1, new_paragraph).setAttributes(style).merge()

    // current_paragraph.setAttributes(style)
    after.push(inserted_paragraph.getText())
  }

  return {
    before: before.join("\n"),
    after: after.join("\n")
  }
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getPreferences() {
  const userProperties = PropertiesService.getUserProperties();
  return {
    action: userProperties.getProperty('action'),
    skipHeadings: userProperties.getProperty('skipHeadings'),
    skippedLevels: userProperties.getProperty('skippedLevels')
  };
}

