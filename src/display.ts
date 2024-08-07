import * as vscode from 'vscode';
import axios from 'axios';
import { AxiosResponse, AxiosRequestConfig } from "axios";
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { submitSolution } from './submit';
import login from './login';

export function getWebviewContent(problemContent: string, cssContent: string): string {
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

export async function fetchProblemContent(problemUrl: string): Promise<string | null> {
    const problemResponse = await axios.get(problemUrl);
    const problemPage = cheerio.load(problemResponse.data);
    let problemContent = problemPage('.problem-statement').html();
    if (problemContent) {
        problemContent = problemContent.replace(/\$\$\$/g, '$$').replace(/\\\$/g, '$');
        console.log(problemContent);
        return problemContent;
    }
    return null;
}

export async function fetchCSSContent(): Promise<string> {
    const cssResponse = await axios.get('https://codeforces.com/css/problem-statement.css');
    return cssResponse.data;
}

export function createWebviewPanel(problemContent: string, cssContent: string) {
    const panel = vscode.window.createWebviewPanel(
        'codeforcesProblem',
        'Codeforces Problem',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );
    panel.webview.html = getWebviewContent(problemContent, cssContent);
}

export async function displayPage(URL: string | null) {
    if (URL) {
        const problemContent = await fetchProblemContent(URL);
        if (problemContent) {
            const cssContent = await fetchCSSContent();
            createWebviewPanel(problemContent, cssContent);
        } else {
            vscode.window.showErrorMessage('Failed to extract problem content.');
        }
    } else {
        vscode.window.showErrorMessage('No problem links found.');
    }
}

export async function fetchContestContent(contestURL: string): Promise<string | null> {
    const contestResponse = await axios.get(contestURL);
    const contestPage = cheerio.load(contestResponse.data);
    let contestContent = contestPage('#pageContent').html();
    if (contestContent) {
        contestContent = contestContent.replace(/\$\$\$/g, '$$').replace(/\\\$/g, '$');
        return contestContent;
    }
    return null;
}

export async function displayTutorial(URL: string | null) {
    if (URL) {
        const contestContent = await fetchContestContent(URL);
        if (contestContent) {
            const cssContent = await fetchCSSContent();
            createWebviewPanel(contestContent, cssContent);
        } else {
            vscode.window.showErrorMessage('Failed to extract tutorial content.');
        }
    } else {
        vscode.window.showErrorMessage('No tutorial links found.');
    }
}