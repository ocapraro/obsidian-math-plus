import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, renderMath, finishRenderMath, loadMathJax, FileManager, FileSystemAdapter, Vault } from 'obsidian';
import { formatEquation } from "./parser";
import { renderCanvas } from "./view"
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";
import { FileSystemHandle } from '@excalidraw/excalidraw/types/data/filesystem';

// const Data = require( "./drawings/data.svg");

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	selectVisable: boolean;
	rectVisable: boolean;
	diamondVisable: boolean;
	ellipseVisable: boolean;
	arrowVisable: boolean;
	lineVisable: boolean;
	penVisable: boolean;
	textVisable: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	selectVisable: true,
	rectVisable: false,
	diamondVisable: false,
	ellipseVisable: false,
	arrowVisable: true,
	lineVisable: true,
	penVisable: true,
	textVisable: true
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		await loadMathJax();

		// let manager = new FileSystemAdapter();
		// manager.mkdir("./MathDrawings");

		// this.registerView(
    //   VIEW_TYPE_EXAMPLE,
    //   (leaf) => new ExampleView(leaf)
    // );

    // this.addRibbonIcon("dice", "Activate view", () => {
    //   this.activateView();
    // });

		this.registerMarkdownCodeBlockProcessor("math", async (source, el, ctx) => {
			const parser = new DOMParser();

			const saveToFile = async (fileName:string,data:string) => {
				const configPath = this.app.vault.configDir + "/plugins/obsidian-math-plus/drawings/"+fileName;
				if(await this.app.vault.adapter.exists(configPath)){
					await this.app.vault.adapter.write(configPath,data);
				}else{
					await this.app.vault.create(configPath,data);
				}
				if(await this.app.vault.adapter.exists(configPath)){
					let svgData = await this.app.vault.adapter.read(configPath);
					el.querySelector(".excalidraw-canvas-wrapper").replaceWith(parser.parseFromString(`<div class="math-svg-wrapper">${svgData}</div>`, "text/html").body.querySelector("div"));
					drawButton.show();
					doneButton.hide();
					new Notice("Saved")
				}
			}

			const resizeUi = (id: number) => {
				let canvas = document.getElementById(`math-canvas-${id}`);
				if (canvas.offsetHeight<350) {
					canvas.addClass("small-canvas");
				}
			}

			// Render Excalidraw

			let blockOptions = source.match(/\|\|.+\|\|/gm)?JSON.parse(source.match(/\|\|.+\|\|/gm)[0].replace(/\|\|/gm,"")):null;
			let blockId: number;
			if(blockOptions) {
				blockId = blockOptions.id;
			}
			const configPath = this.app.vault.configDir + `/plugins/obsidian-math-plus/drawings/data-${blockId}.svg`;
			if(await this.app.vault.adapter.exists(configPath)){
				let svgData = await this.app.vault.adapter.read(configPath);
				el.append(parser.parseFromString(`<div class="math-svg-wrapper">${svgData}</div>`, "text/html").body.querySelector("div"));
				// renderCanvas(el, blockId, saveToFile);
			}

			// add id class to block
			el.addClass("math-block-"+blockId);

			// Hide Buttons
			this.settings.selectVisable?null:el.addClass("no-select");
			this.settings.rectVisable?null:el.addClass("no-rect");
			this.settings.diamondVisable?null:el.addClass("no-diamond");
			this.settings.ellipseVisable?null:el.addClass("no-ellipse");
			this.settings.arrowVisable?null:el.addClass("no-arrow");
			this.settings.lineVisable?null:el.addClass("no-line");
			this.settings.penVisable?null:el.addClass("no-pen");
			this.settings.textVisable?null:el.addClass("no-text");

			// Parse Equation
			let rawEqu = source.replace(/\|\|.+\|\|\n+/gm,"");
			let equ = formatEquation(rawEqu);

			// Add button group
			const editButtonGroup = el.createEl("div",{ cls: "math-button-group"});

			// Add Copy LaTex Button
			const copyIcon = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="block-button"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M384 96L384 0h-112c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48H464c26.51 0 48-21.49 48-48V128h-95.1C398.4 128 384 113.6 384 96zM416 0v96h96L416 0zM192 352V128h-144c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48L288 416h-32C220.7 416 192 387.3 192 352z"/></svg>`, 'text/html');
			const copyButton = editButtonGroup.createEl("div",{ cls: "math-button"});
			copyButton.append(copyIcon.body.querySelector("svg"));
			copyButton.setAttr("aria-label","Copy as LaTex");
			copyButton.onClickEvent(()=>{
				navigator.clipboard.writeText(equ);
				new Notice('Block Copied');
			});

			// Add Draw Button
			const drawIcon = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L444.3 197.7L314.3 67.72L362.7 19.32zM421.7 220.3L188.5 453.4C178.1 463.8 165.2 471.5 151.1 475.6L30.77 511C22.35 513.5 13.24 511.2 7.03 504.1C.8198 498.8-1.502 489.7 .976 481.2L36.37 360.9C40.53 346.8 48.16 333.9 58.57 323.5L291.7 90.34L421.7 220.3z"/></svg>`,"text/html")
			const drawButton = editButtonGroup.createEl("div",{ cls: "math-button"});

			// Add Done Button
			const doneIcon = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M438.6 105.4C451.1 117.9 451.1 138.1 438.6 150.6L182.6 406.6C170.1 419.1 149.9 419.1 137.4 406.6L9.372 278.6C-3.124 266.1-3.124 245.9 9.372 233.4C21.87 220.9 42.13 220.9 54.63 233.4L159.1 338.7L393.4 105.4C405.9 92.88 426.1 92.88 438.6 105.4H438.6z"/></svg>`,"text/html")
			const doneButton = editButtonGroup.createEl("div",{ cls: "math-button"});

			// Add Draw Button Onclick
			drawButton.append(drawIcon.body.querySelector("svg"));
			drawButton.setAttr("aria-label","Draw on Block");
			drawButton.onClickEvent(async ()=>{
				const wrapper = el.createEl("div",{cls:"excalidraw-canvas-wrapper"})
				renderCanvas(wrapper, blockId, saveToFile);
				let svgWrapper = el.querySelector(".math-svg-wrapper") as HTMLElement;
				if(svgWrapper){
					svgWrapper.remove();
					// setTimeout(() => {
					// 	let eWrapper = document.querySelector(".excalidraw-wrapper") as HTMLElement;
					// 	eWrapper.style.opacity = "1";
					// }, 1000);
				}
				drawButton.hide();
				doneButton.show();
				// setTimeout(() => {
				// 	resizeUi(blockId);
				// }, 600);
				// renderMath(equ, true)
				// finishRenderMath();
			});

			// Add done Button Onclick
			doneButton.append(doneIcon.body.querySelector("svg"));
			doneButton.setAttr("aria-label","Save Drawing");
			doneButton.onClickEvent(async ()=>{
				let saveButton = el.querySelector(".math-save-button") as HTMLElement;
				saveButton.click();
			});
			doneButton.hide();

			// Render Equation
			el.append(renderMath(equ, true));
			finishRenderMath();
    });

		this.addCommand({
      id: "insert-math-block",
      name: "Insert math block",
			hotkeys: [{ modifiers: ["Mod"], key: "m" }],
      editorCallback: (editor: Editor) => {
				let id = parseInt(localStorage.getItem("math-max-id"))+1;
        editor.replaceRange("```math\n||{\"id\":"+id+"}||\n\n\n```", editor.getCursor());
				editor.setCursor(editor.getCursor().line+3);
      },
    });
		/*
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
		*/

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

const renderButton = (el: any, id: string, svg: string ) => {
	const parser = new DOMParser();
	const icon = parser.parseFromString(svg,'text/html');
	const button = el.createEl("div",{ cls: `math-excalidraw-button math-${id}-button`});
	button.addEventListener("click", (event: any)=>{
		const target = event.target || event.srcElement;
		document.querySelectorAll(`.math-excalidraw-button`).forEach(e => {e.removeClass("selected-button")});
		button.addClass("selected-button");
		const excalidrawButton = document.querySelectorAll(`[data-testid="${id}"]`)[0] as HTMLElement;
		excalidrawButton.click();
	}, false);
	const iconWrapper = button.createEl("div",{ cls: "math-excalidraw-icon"});
	iconWrapper.append(icon.body.querySelector("svg"));
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Obsidian Math + Settings'});
		containerEl.createEl('h3', {text: 'Excalidraw UI'});

		new Setting(containerEl)
		.setName('Select Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.selectVisable)
		.onChange(async (value) => {
			this.plugin.settings.selectVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Rectangle Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.rectVisable)
		.onChange(async (value) => {
			this.plugin.settings.rectVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Diamond Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.diamondVisable)
		.onChange(async (value) => {
			this.plugin.settings.diamondVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Ellipse Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.ellipseVisable)
		.onChange(async (value) => {
			this.plugin.settings.ellipseVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Line Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.lineVisable)
		.onChange(async (value) => {
			this.plugin.settings.lineVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Arrow Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.arrowVisable)
		.onChange(async (value) => {
			this.plugin.settings.arrowVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Draw Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.penVisable)
		.onChange(async (value) => {
			this.plugin.settings.penVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Text Button Visable')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.textVisable)
		.onChange(async (value) => {
			this.plugin.settings.textVisable = value;
			await this.plugin.saveSettings();
		}));
	}
}
