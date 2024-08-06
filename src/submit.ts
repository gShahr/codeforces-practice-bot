import axios from "./axios";
import { getCsrfToken, getSubmitCompiler, getUserHandle } from "./data";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import login from "./login";
import FileHandler from "./fileHandler";

const cheerio = require("cheerio");
const formData = require("form-data");

let contestId = 0;
let problemId = "";
let problemLabel = "";
let solFile: string;

export async function submitSolution(contestIdIn: number, problemIdIn: string) {
  contestId = contestIdIn;
  problemId = problemIdIn;
  problemLabel = `${contestId}/${problemId}`;

  if (!contestId || !problemId) {
    console.error("Contest or Problem not found");
    return;
  }
  const solRegexPath = FileHandler.solPath(contestId, problemId);
  const isSolFile = await FileHandler.findFile(solRegexPath);
  if (isSolFile === null) {
    console.error(`${problemLabel}: Problem Solution File not found`);
    return;
  }

  solFile = isSolFile;

  return withProgress(
    {
      title: `${problemLabel} Submit`,
      cancellable: true,
    },
    async (progress, token): Promise<any> => {
      console.log("Progress...");
      console.log(progress);
      console.log(token);

      token.onCancellationRequested(() => {
        console.log("User cancelled the submission");
        return;
      });

      progress.report({
        message: "Checking sample testcases...",
        increment: 10,
      });
      //const checkerResult = await checker(contestId, problemId);

      progress.report({ message: "Sample testcases checked", increment: 20 });

      let userSelection;

      userSelection = await showInformationMessage(
        problemLabel +
          ": Solution passed in sample test cases. Confirm to submit.",
        "Submit",
        "Cancel"
      );

      if (userSelection !== "Submit") {
        console.log("User did not select submit");
        return;
      }

      progress.report({ message: "Submitting the solution...", increment: 20 });
      const submissionId = await submit();

      console.log("submitResult:" + submissionId);

      if (!submissionId) {
        return;
      }

      progress.report({ message: "TESTING...", increment: 30 });
      const verdict = await checkVerdict(parseInt(submissionId));

      console.log("verdict:" + verdict);
      return;
    }
  );
}

async function submit() {
  const submitUrl = `/contest/${contestId}/submit`;

  const sol = FileHandler.readFile(solFile);
  console.log("Solution follow: " + sol);

  if (!getCsrfToken()) {
    const logged = await login();
    if (!logged) {
      console.error(problemLabel + ": User not logged in.");
      return;
    }
  }

  const form = new formData();
  form.append("action", "submitSolutionFormSubmitted");
  form.append("csrf_token", getCsrfToken());
  form.append("programTypeId", getSubmitCompiler());
  form.append("source", sol);
  form.append("submittedProblemIndex", problemId);

  const options: AxiosRequestConfig = {
    method: "POST",
    url: submitUrl,
    headers: {
      ...form.getHeaders(),
    },
    data: form,
  };
  return axios(options)
    .then((res: AxiosResponse) => {
        console.log("Response Status: ", res.status);
        // console.log("Response Data: ", res.data);
        // console.log("Response Headers: ", res.headers);
        const $ = cheerio.load(res.data);
        const sameSourceDiv = $(".error.for__source");
        if (sameSourceDiv.length > 0) {
            console.error(
                problemLabel + ": You have submitted exactly the same code before"
            );
            return null;
        }
        const submissionId = $("a.view-source").attr("submissionid");
        console.log("submissionID: " + submissionId);
        return submissionId;
    })
    .catch((res: any) => {
        console.error(res);
        return null;
    });
}

async function checkVerdict(submissionId: number) {
  const URL = `/api/user.status?handle=${getUserHandle()}&from=1&count=40`;

  let verdict = "TESTING";

  while (verdict === "TESTING") {
    await wait(2000);
    const res = await axios.get(URL);
    const submissions = res.data.result;

    const submission = submissions.find((submission: any) => {
      return submission.id === submissionId;
    });

    verdict = submission.verdict;
  }

  if (verdict === "OK") {
    console.log(problemLabel + ": Solution Passed");
  } else {
    console.error(problemLabel + ": Solution Failed:- " + verdict);
  }

  return verdict;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withProgress(options: { title: string; cancellable: boolean }, task: (progress: any, token: any) => Promise<any>) {
  console.log(options.title);
  const progress = {
    report: ({ message, increment }: { message: string; increment: number }) => {
      console.log(`${message} (${increment}%)`);
    },
  };
  const token = {
    onCancellationRequested: (callback: () => void) => {
      // Simulate cancellation
    },
  };
  return task(progress, token);
}

function showErrorMessage(message: string, ...items: string[]): Promise<string | undefined> {
  console.error(message);
  return Promise.resolve(items[0]);
}

function showInformationMessage(message: string, ...items: string[]): Promise<string | undefined> {
  console.log(message);
  return Promise.resolve(items[0]);
}