import express from 'express';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

const app = express();
app.use(express.json());

ffmpeg.setFfmpegPath(ffmpegStatic ?? '');

app.post('/process-video', (req, res) => {
	console.log('Processing video ...');
	const inputFilePath = req.body.inputFilePath,
		outputFilePath = req.body.outputFilePath;
	console.log('Input file path: ' + inputFilePath);
	console.log('Output file path: ' + outputFilePath);

	if (!inputFilePath)
		return res.status(400).send('Input file path is required');
	if (!outputFilePath)
		return res.status(400).send('Output file path is required');

	ffmpeg(inputFilePath)
		.outputOptions('-vf', 'scale=-1:360') // 360p
		.on('end', function () {
			console.log('Processing finished successfully');
			res.status(200).send('Processing finished successfully');
		})
		.on('error', function (err: any) {
			console.log('An error occurred: ' + err.message);
			console.log(err);
			res.status(500).send('An error occurred: ' + err.message);
		})
		.save(outputFilePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Video Processing Service listening at http://localhost:${port}`);
});
