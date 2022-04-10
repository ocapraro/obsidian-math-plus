import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, renderMath, finishRenderMath, loadMathJax } from 'obsidian';
import { formatEquation } from "./parser";
import { renderCanvas } from "./view"
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		await loadMathJax();

		// this.registerView(
    //   VIEW_TYPE_EXAMPLE,
    //   (leaf) => new ExampleView(leaf)
    // );

    // this.addRibbonIcon("dice", "Activate view", () => {
    //   this.activateView();
    // });

		this.registerMarkdownCodeBlockProcessor("math", async (source, el, ctx) => {
			const parser = new DOMParser();
			const copyIcon = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="block-button"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M384 96L384 0h-112c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48H464c26.51 0 48-21.49 48-48V128h-95.1C398.4 128 384 113.6 384 96zM416 0v96h96L416 0zM192 352V128h-144c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48L288 416h-32C220.7 416 192 387.3 192 352z"/></svg>`, 'text/html');
			// el.append(<ExcalidrawCanvas />);
			renderCanvas(el);

			// Parse Equation
			let equ = formatEquation(source);

			// Add Copy LaTex Button
			const copyButton = el.createEl("div",{ cls: "edit-block-button math-copy-button"});
			copyButton.append(copyIcon.body);
			copyButton.setAttr("aria-label","Copy as LaTex");
			copyButton.onClickEvent(()=>{
				navigator.clipboard.writeText(equ);
				new Notice('Block Copied');
			});

			// Add Excalidraw UI
			// const exUi = el.createEl("div",{ cls: "math-button-group"});
			// // Select Button
			// renderButton(exUi, "selection", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="" style="padding-left:2px;"><path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"></path></svg>`);
			// // Rectangle Button
			// renderButton(exUi, "rectangle", `<svg viewBox="0 0 448 512"><path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"></path></svg>`);
			// // Arrow Button
			// renderButton(exUi, "arrow", `<svg viewBox="0 0 448 512" class="rtl-mirror"><path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"></path></svg>`);
			// // Pencil Button
			// renderButton(exUi, "freedraw", `<svg viewBox="0 0 512 512"><path fill="currentColor" d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z"></path></svg>`);

			// el.addEventListener('keydown', (e) => {
			// 	if(e.code==="Escape") {
			// 		const selectButton = el.querySelector(`.math-selection-button`) as HTMLElement;
			// 		selectButton.click();
			// 	}
			// });
			// Render Equation
			el.append(renderMath(equ, true));
			// el.append(excalidrawFrame.body);
			finishRenderMath();
    });

		this.addCommand({
      id: "insert-math-block",
      name: "Insert math block",
			hotkeys: [{ modifiers: ["Mod"], key: "m" }],
      editorCallback: (editor: Editor) => {
        editor.replaceRange("```math\n\n```", editor.getCursor());
				editor.setCursor(editor.getCursor().line+1);
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

		containerEl.createEl('h2', {text: 'Latex Alternative Settings'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
