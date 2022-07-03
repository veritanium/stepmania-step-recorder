# StepMania Dance Recorder

The purpose of this project is to help simplify dance step creation for Step Mania files.
The normal method involves using Step Mania's editor UI to create steps for songs, but this is a bit by bit process and is very time consuming and hard to track entire step sequences while developing them.

This app aims to help by allowing the user to play a song and type in the steps as it plays. It will then generate an .sm style step notation to import into Step Mania and allow fine-tuning in the Step Mania editor.

The app is written in vanilla Javascript and uses tailwind css with the idea of making a true single page application that can be statically hosted.

## Development

Start with 

```bash
npi ci
```

and then run 

```bash
npm run serve
```

to start the app in the browser.

## Credits

Cudos to Eractus/tapTapRevolution for inspiring the canvas aspect of the app.