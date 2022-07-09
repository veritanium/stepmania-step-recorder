# StepMania Dance Recorder

The purpose of this project is to help simplify dance step creation for Step Mania files.
The normal method involves using Step Mania's editor UI to create steps for songs, but this is a bit by bit process and is very time consuming and hard to track entire step sequences while developing them.

This app aims to help by allowing the user to play a song and type in the steps as it plays. It will then generate an .sm style step notation to import into Step Mania and allow fine-tuning in the Step Mania editor.

The app is written in vanilla Javascript and uses tailwind css with the idea of making a true single page application that can be statically hosted.

This projects is starting as a very basic proof-of-concept and will be refactored as architectural components are solidified. The end goal is to have a single file application. It is for this reason more complex frameworks like Vue or React are not being utilized and the code is in one file and in modern vanilla JavaScript

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
