import { sep, join, resolve } from 'path';
import { nanoid } from 'nanoid';
import { readdir } from 'fs/promises';
import fs from 'fs';

if (!fs.existsSync('.env')) {
  console.error('.env file not found. Please create a .env file.');
  process.exit(1);
}

import dotenv from 'dotenv';
dotenv.config();

export async function* getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			const currFile = res.split('.');
			if (currFile[currFile.length - 1] === 'bin') {
				yield res;
			}
		}
	}
}

export function stripAnsiCodes(str) {
	return str.replace(/\u001b\[\d+m/g, '');
}

export const messagesToString = (messages, newLine = false) => {
	const whitespace = newLine ? `\\\n` : ` `;
	return messages
		.map((m) => {
			return `${m.role || 'assistant'}:${whitespace}${m.content}`;
		})
		.join('\n');
};

export const dataToResponse = (
	data,
	promptTokens,
	completionTokens,
	stream = false,
	reason = null
) => {
	const currDate = new Date();
	const contentData = { content: data, role: 'assistant', };
	const contentName = stream ? 'delta' : 'message';

	return {
		choices: [
			{
				[contentName]: !!data ? contentData : {},
				finish_reason: reason,
				index: 0,
			},
		],
		created: currDate.getTime(),
		id: nanoid(),
		object: 'chat.completion.chunk',
		usage: {
			prompt_tokens: promptTokens,
			completion_tokens: completionTokens,
			total_tokens: promptTokens + completionTokens,
		},
	};
};

export const dataToEmbeddingResponse = (output) => {
	return {
		object: 'list',
		data: [
			{
				object: 'embedding',
				embedding: output,
				index: 0,
			},
		],
		embeddingSize: output.length,
	};
};

export const getModelPath = (req, res) => {
	const API_KEY = req.headers.authorization;
	if (!API_KEY) {
		return;
	}
	// We're using API_KEY as a slot to provide the "llama.cpp" model path
	const modelPath = API_KEY.split(' ')[1];
	return normalizePath(modelPath);
};

// Normalizes and fixes all the slahses for Win/Mac
export const normalizePath = (path) =>
	sep === '\\' ? path.replace(/\//g, '\\') : path.replace(/\\/g, '/');

const splitPath = (path) => path.split(/[\/\\]/);

export const getModelName = (path) => {
	const normalizedPath = normalizePath(path);
	const modelArr = splitPath(normalizedPath);
	return modelArr[modelArr.length - 1];
};

export const getLlamaPath = () => {
	return normalizePath(process.env.LLAMA_PATH);
};

export const compareArrays = (arr1, arr2) => {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (let i = 0; i < arr1.length; i++) {
		const obj1 = arr1[i];
		const obj2 = arr2[i];

		if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
			console.log(`${JSON.stringify(obj1)} !== ${JSON.stringify(obj2)}`);
			return false;
		}
	}

	return true;
};
