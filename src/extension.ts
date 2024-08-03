// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codeforces-practice-bot" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const loginDisposable = vscode.commands.registerCommand('codeforces-practice-bot.login', async () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        const username = process.env.CODEFORCES_USERNAME;
        const password = process.env.CODEFORCES_PASSWORD;

        if (username && password) {
            try {
                const response = await axios.post('https://codeforces.com/enter', {
                    handleOrEmail: username,
                    password: password,
                    action: 'enter',
                    csrf_token: '' // You might need to handle CSRF token here
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                if (response.status === 200) {
                    vscode.window.showInformationMessage('Logged in successfully!');
                    const getProblemButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                    getProblemButton.text = '$(light-bulb) Get Codeforces Problem';
                    getProblemButton.command = 'codeforces-practice-bot.getProblem';
                    getProblemButton.show();
                    context.subscriptions.push(getProblemButton);
                } else {
                    vscode.window.showErrorMessage('Failed to log in. Please check your credentials.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('An error occurred while logging in.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('Username or password cannot be empty.');
        }
    });

	function getWebviewContent(problemContent: string, cssContent: string): string {
		return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Codeforces Problem</title>
		<style>
			${cssContent}
		</style>
	</head>
	<body>
		<div class="problem-statement">
			${problemContent}
		</div>
	</body>
	</html>`;
	}

    const getProblemDisposable = vscode.commands.registerCommand('codeforces-practice-bot.getProblem', async () => {
        try {
            const response = await axios.get('https://codeforces.com/problemset?tags=1600-1600');
            const $ = cheerio.load(response.data);
            const firstProblemLink = $('a[href^="/problemset/problem/"]').first().attr('href');

            if (firstProblemLink) {
                const problemResponse = await axios.get(`https://codeforces.com${firstProblemLink}`);
                const problemPage = cheerio.load(problemResponse.data);
                const problemContent = problemPage('.problem-statement').html();

                if (problemContent) {
                    // Fetch the CSS from Codeforces
                    const cssResponse = await axios.get('https://codeforces.com/css/problem-statement.css');
                    const cssContent = cssResponse.data;

                    const panel = vscode.window.createWebviewPanel(
                        'codeforcesProblem', // Identifies the type of the webview. Used internally
                        'Codeforces Problem', // Title of the panel displayed to the user
                        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                        {} // Webview options. More on these later.
                    );

                    // And set its HTML content
                    panel.webview.html = getWebviewContent(problemContent, cssContent);
                } else {
                    vscode.window.showErrorMessage('Failed to extract problem content.');
                }
            } else {
                vscode.window.showErrorMessage('No problem links found.');
            }
        } catch (error) {
            vscode.window.showErrorMessage('An error occurred while fetching the problem.');
            console.error(error);
        }
    });

    context.subscriptions.push(loginDisposable);
    context.subscriptions.push(getProblemDisposable);
}

export function deactivate() {}