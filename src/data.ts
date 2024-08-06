import * as vscode from 'vscode';
import axios from 'axios';
import { AxiosResponse, AxiosRequestConfig } from "axios";
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { submitSolution } from './submit';

const envPath = path.resolve(process.cwd(), '.env');
const pathNeeded = 'C:/Users/Gabriel_Shahrouzi/Documents/0-git-local-stuff/cs-projects/codeforces-practice-bot/codeforces-practice-bot/.env';
dotenv.config({ path: pathNeeded });
require('dotenv').config({path: pathNeeded});
console.log(envPath);
console.log('CODEFORCES_USERNAME:', process.env.CODEFORCES_USERNAME);


let data = {
    handleOrEmail: process.env.CODEFORCES_USERNAME || '',
    password: process.env.CODEFORCES_PASSWORD || '',
    lastUpdate: 1603880554122,
    cookie: null,
    csrfToken: null,
    compileCommand: "g++-8 --std=c++14",
    templateFile: "",
    templateLineNo: 0,
    submitCompiler: 54
  };
  
  export function updateData(newData: any) {
      data = newData;
  }
  
  export function getData() {
    console.log(data);
      return data;
  }
  
  export function getUserHandle() {
      return data.handleOrEmail;
  }
  
  export function getUserPassword() {
      return data.password;
  }
  
  export function getCookie() {
      return data.cookie;
  }
  
  export function resetCookie() {
      data.cookie = null;
  }
  
  export function getCsrfToken() {
      return data.csrfToken;
  }
  
  export function setUser(userHandle: string | undefined, userPassword: string | undefined) {
  
      console.log('------', userHandle, userPassword);
      data.handleOrEmail = userHandle ? userHandle : '';
      data.password = userPassword ? userPassword : '';
  }
  
  export function setConfiguration(compileCommand: string, templateFile: string, templateLineNo: number) {
      data.compileCommand = compileCommand;
      data.templateFile = templateFile;
      data.templateLineNo = templateLineNo;
  
      console.log(data);
      return;
  }
  
  export function getCompileCommand() {
      return data.compileCommand;
  }
  
  export function setCompileCommand(compileCommand: string) {
      return data.compileCommand = compileCommand;
  }
  
  export function getTemplateFile() {
      return data.templateFile;
  }
  
  export function setTemplateFile(templateFile: string) {
      return data.templateFile = templateFile;
  }
  
  export function getTemplateLineNo() {
      return data.templateLineNo;
  }
  
  export function setTemplateLineNo(templateLineNo: number) {
      return data.templateLineNo = templateLineNo;
  }
  
  export function getSubmitCompiler() {
      return data.submitCompiler;
  }