---
applyTo: "**"
---

# Project Context

- This is a electron project built with Typescript and react. on the file src\electron\preload.cts using this file it communicate with backend to electron process. For this communication we used typesafe wrapper function. For the automation related task we used python in the python folder. For python project for package management we use UV package manager and to compiled the python project used pyinstaller here using the spec file from here python\whiskey_app.spec . Using the command npm run build:python it executes the command to build python project exe file and electron process utilze that exe file to do automation kind of work. Python project python\whiskey_app.py this is the file entry point.

- On this project for automation task on python the browser-use local package is used.

# Design and Styling.

- Must follow the design currently project has in place. On pages you need to ensure that there is no scroll so minimum vertical space should be used. On this project all the buttons and the design is box design so there should not any rounded corners.
