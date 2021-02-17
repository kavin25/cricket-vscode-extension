// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const axios = require("axios");
const xmlParser = require("fast-xml-parser");
const Encoder = require("html-encoder-decoder");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(decodeHtmlCharCodes("&quot;"));
  console.log('Congratulations, your extension "cricket" is now active!');
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  console.log(statusBarItem);
  statusBarItem.text = "Cricket Extension";
  statusBarItem.command = "cricket.askQuestion";
  statusBarItem.show();

  let askQuestion = vscode.commands.registerCommand(
    "cricket.askQuestion",
    async function () {
      const items = [
        {
          label: "Live Scores",
          detail: "Display live cricket scores",
          command: "cricket.liveScores",
        },
        {
          label: "Latest News",
          detail: "Display latest cricket news",
          command: "cricket.latestNews",
        },
      ];
      const response = await vscode.window.showQuickPick(items);
      vscode.commands.executeCommand(response.command);
    }
  );

  let disposable = vscode.commands.registerCommand(
    "cricket.liveScores",
    function () {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Fetching Scores...",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          const res = await axios.get(
            "http://static.cricinfo.com/rss/livescores.xml"
          );
          const scores = xmlParser
            .parse(res.data)
            .rss.channel.item.map((score) => ({
              label: decodeHtmlCharCodes(score.title),
              link: score.guid,
            }));
          progress.report({ increment: 100 });
          const match = await vscode.window.showQuickPick(scores);
          if (match === null) return;
          vscode.env.openExternal(match.link);
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
            return;
          });
        }
      );
    }
  );

  let disposableTwo = vscode.commands.registerCommand(
    "cricket.latestNews",
    function () {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Fetching News...",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          const res = await axios.get(
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml"
          );
          const newss = xmlParser
            .parse(res.data)
            .rss.channel.item.map((news) => ({
              label: decodeHtmlCharCodes(news.title),
              detail: decodeHtmlCharCodes(news.description),
              link: news.guid,
            }));
          progress.report({ increment: 100 });
          const news = await vscode.window.showQuickPick(newss, {
            matchOnDetail: true,
          });
          if (news === null) return;
          vscode.env.openExternal(news.link);
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
            return;
          });
        }
      );
    }
  );

  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableTwo);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function decodeHtmlCharCodes(str) {
  return Encoder.decode(str);
}

module.exports = {
  activate,
  deactivate,
};
