// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { AxiosResponse, AxiosRequestConfig } from "axios";
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { submitSolution } from './submit';
import login from './login';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
const pathNeeded = 'C:/Users/Gabriel_Shahrouzi/Documents/0-git-local-stuff/cs-projects/codeforces-practice-bot/codeforces-practice-bot/.env';
dotenv.config({ path: pathNeeded });
require('dotenv').config({path: pathNeeded});
console.log(envPath);
console.log('CODEFORCES_USERNAME:', process.env.CODEFORCES_USERNAME);

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
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            <script>
                window.MathJax = {
                    tex: {
                        inlineMath: [['$', '$'], ['\\(', '\\)']]
                    },
                    svg: {
                        fontCache: 'global'
                    }
                };
            </script>
        </head>
        <body>
            <div class="problem-statement">
                ${problemContent}
            </div>
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    MathJax.typesetPromise();
                });
            </script>
        </body>
        </html>`;
    }

    interface Problem {
        contestId: number;
        index: string;
        name: string;
        type: string;
        rating: number;
        tags: string[];
    }
    
    interface SolvedProblem {
        contestId: number;
        index: string;
    }

    interface ProblemStatistics {
        contestId: number;
        index: string;
        solvedCount: number;
    }
    
    async function fetch1600RatedProblems(): Promise<Problem[]> {
        try {
            const rating = 1600;
            const response = await axios.get(`https://codeforces.com/api/problemset.problems?rating=${rating}`);
            if (response.data.status !== 'OK') {
                throw new Error('Failed to fetch problems');
            }
            const problems: Problem[] = response.data.result.problems;
            const problemStatistics: ProblemStatistics[] = response.data.result.problemStatistics;
            const filteredProblems = problems
            .filter((problem: Problem) => problem.rating === 1600)
            .filter((problem: Problem) => {
                const stats = problemStatistics.find(
                    (stat: ProblemStatistics) => stat.contestId === problem.contestId && stat.index === problem.index
                );
                return stats && stats.solvedCount > 2000;
            });

            return filteredProblems;
        } catch (error) {
            console.error('Error fetching problems:', error);
            return [];
        }
    }
    
    async function fetchUserSolvedProblems(handle: string): Promise<SolvedProblem[]> {
        try {
            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
            if (response.data.status !== 'OK') {
                throw new Error('Failed to fetch user status');
            }
    
            const solvedProblems = response.data.result
                .filter((submission: any) => submission.verdict === 'OK')
                .map((submission: any) => ({
                    contestId: submission.problem.contestId,
                    index: submission.problem.index
                }));
    
            return solvedProblems;
        } catch (error) {
            console.error('Error fetching user solved problems:', error);
            return [];
        }
    }
    
    async function getFiltered1600RatedProblems(handle: string) {
        const problems = await fetch1600RatedProblems();
        const solvedProblems = await fetchUserSolvedProblems(handle);
    
        const solvedProblemSet = new Set(solvedProblems.map((p: SolvedProblem) => `${p.contestId}-${p.index}`));
        const filteredProblems = problems.filter(problem => !solvedProblemSet.has(`${problem.contestId}-${problem.index}`));
    
        return filteredProblems;
    }

    const getProblemDisposable = vscode.commands.registerCommand('codeforces-practice-bot.getProblem', async () => {
        try {
            let username = process.env.CODEFORCES_USERNAME;
            if (username === undefined) {
                throw new Error("CODEFORCES_USERNAME environment variable is not set.");
            }
            let data = await getFiltered1600RatedProblems(username);
            console.log("User data while getting problem: " + data);
            const problemUrl = `https://codeforces.com/problemset/problem/${data[0].contestId}/${data[0].index}`;

            
            if (problemUrl) {
                const problemResponse = await axios.get(problemUrl);
                const problemPage = cheerio.load(problemResponse.data);
                let problemContent = problemPage('.problem-statement').html();
    
                if (problemContent) {
                    problemContent = problemContent.replace(/\$\$\$/g, '$$').replace(/\\\$/g, '$');
                    console.log(problemContent);

                    // Fetch the CSS from Codeforces
                    const cssResponse = await axios.get('https://codeforces.com/css/problem-statement.css');
                    const cssContent = cssResponse.data;
    
                const panel = vscode.window.createWebviewPanel(
                    'codeforcesProblem',
                    'Codeforces Problem',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true
                    }
                );
    
                    // Set the HTML content
                    panel.webview.html = getWebviewContent(problemContent, cssContent);
                } else {
                    vscode.window.showErrorMessage('Failed to extract problem content.');
                }
            } else {
                vscode.window.showErrorMessage('No problem links found.');
            }
            const contestId = data[0].contestId;
            const problemId = data[0].index;
            const dirPath = path.join(vscode.workspace.rootPath || '', `${contestId}`);
            const filePath = path.join(dirPath, `${problemId}.cpp`);
            const templatePath = path.join(__dirname, '..', 'colored-debug-template.cpp');
            console.log(dirPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            if (!fs.existsSync(filePath)) {
                if (fs.existsSync(templatePath)) {
                    const template = fs.readFileSync(templatePath, 'utf-8');
                    fs.writeFileSync(filePath, template);
                } else {
                    console.log('Template file not found.');
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage('An error occurred while fetching the problem.');
            console.error(error);
        }
    });

    const submitProblemDisposable = vscode.commands.registerCommand('codeforces-practice-bot.submitProblem', async () => {
        let username = process.env.CODEFORCES_USERNAME;
        if (username === undefined) {
            throw new Error("CODEFORCES_USERNAME environment variable is not set.");
        }
        let data = await getFiltered1600RatedProblems(username);
        const contestId = data[0].contestId;
        const problemId = data[0].index;
        await submitSolution(contestId, problemId);
    });

    context.subscriptions.push(loginDisposable);
    context.subscriptions.push(getProblemDisposable);
    const getProblemButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    getProblemButton.text = '$(cloud-download) Get Problem';
    getProblemButton.command = 'codeforces-practice-bot.getProblem';
    getProblemButton.tooltip = 'Fetch a random problem from Codeforces';
    getProblemButton.show();
    context.subscriptions.push(getProblemButton);

    const submitProblemButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    submitProblemButton.text = '$(cloud-upload) Submit Problem';
    submitProblemButton.command = 'codeforces-practice-bot.submitProblem';
    submitProblemButton.tooltip = 'Submit a problem to Codeforces';
    submitProblemButton.show();
    context.subscriptions.push(submitProblemButton);
}

export function deactivate() {}