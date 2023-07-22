import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

const storage = new Storage();
ffmpeg.setFfmpegPath(ffmpegStatic ?? '');

const rawVideosBucketName = 'adrian333dev-raw-videos';
const processedVideosBucketName = 'adrian333dev-processed-videos';

const localRawVideoPath = './raw-videos/';
const localProcessedVideoPath = './processed-videos/';

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
const ensureDirectoryExists = (dirPath: string) => {
	if (!fs.existsSync(dirPath))
		fs.mkdirSync(dirPath), console.log(`Created directory ${dirPath}`);
};

/**
 * Creates the local directories for raw and processed videos.
 */
export const setupDirectories = () => {
	ensureDirectoryExists(localRawVideoPath);
	ensureDirectoryExists(localProcessedVideoPath);
};

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
	return new Promise<void>((resolve, reject) => {
		ffmpeg(`${localRawVideoPath}${rawVideoName}`)
			.outputOptions('-vf', 'scale=-1:360') // 360p
			.on('end', () => {
				console.log('Processing finished successfully'), resolve();
			})
			.on('error', (err: any) => {
				console.error('An error occurred: ' + err.message), reject(err);
			})
			.save(`${localProcessedVideoPath}${processedVideoName}`);
	});
}

/**
 * @param fileName - The name of the file to download from the
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export const downloadRawVideo = async (fileName: string) => {
	const options = { destination: `${localRawVideoPath}${fileName}` };
	await storage.bucket(rawVideosBucketName).file(fileName).download(options);
	console.log(
		`gs://${rawVideosBucketName}/${fileName} downloaded to ${localRawVideoPath}${fileName}.`
	);
};

/**
 * @param fileName - The name of the file to upload from the
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export const uploadProcessedVideo = async (fileName: string) => {
	const bucket = storage.bucket(processedVideosBucketName),
		options = { destination: fileName };
	await bucket.upload(`${localProcessedVideoPath}${fileName}`, options);
	console.log(`${fileName} uploaded to ${processedVideosBucketName}.`);
	await bucket.file(fileName).makePublic();
};

/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
const deleteFile = (filePath: string) => {
	return new Promise<void>((resolve, reject) => {
		fs.unlink(filePath, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
};

/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 *
 */
export const deleteRawVideo = (fileName: string) =>
	deleteFile(`${localRawVideoPath}${fileName}`);

/**
 * @param fileName - The name of the file to delete from the
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
export const deleteProcessedVideo = (fileName: string) =>
	deleteFile(`${localProcessedVideoPath}${fileName}`);
