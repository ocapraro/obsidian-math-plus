import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, renderMath, finishRenderMath, loadMathJax } from 'obsidian';
import { formatEquation } from "./parser";
import { renderCanvas } from "./view"

interface MathPlusSettings {
	selectVisable: boolean;
	rectVisable: boolean;
	diamondVisable: boolean;
	ellipseVisable: boolean;
	arrowVisable: boolean;
	lineVisable: boolean;
	penVisable: boolean;
	textVisable: boolean;
}

const DEFAULT_SETTINGS: MathPlusSettings = {
	selectVisable: true,
	rectVisable: false,
	diamondVisable: false,
	ellipseVisable: false,
	arrowVisable: true,
	lineVisable: true,
	penVisable: true,
	textVisable: true
}

export default class MathPlus extends Plugin {
	settings: MathPlusSettings;

	async onload() {
		await this.loadSettings();
		await loadMathJax();

		this.registerMarkdownCodeBlockProcessor("math", async (source, el, ctx) => {
			const parser = new DOMParser();

			const saveToFile = async (fileName:string,data:string) => {
				let drawingPath = this.app.vault.configDir + "/plugins/obsidian-math-plus/drawings";
				if(!await this.app.vault.adapter.exists(drawingPath)){
					await this.app.vault.adapter.mkdir(drawingPath);
				}
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
				}
				drawButton.hide();
				doneButton.show();
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
				localStorage.setItem("math-max-id", id.toString());
      },
    });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MathPlusSettingTab(this.app, this));
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

class MathPlusSettingTab extends PluginSettingTab {
	plugin: MathPlus;

	constructor(app: App, plugin: MathPlus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Obsidian Math + Settings'});
		containerEl.createEl('h3', {text: 'Excalidraw UI'});

		new Setting(containerEl)
		.setName('Select Button Visible')
		.setDesc("Keys: V or 1")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.selectVisable)
		.onChange(async (value) => {
			this.plugin.settings.selectVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Rectangle Button Visible')
		.setDesc("Keys: R or 2")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.rectVisable)
		.onChange(async (value) => {
			this.plugin.settings.rectVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Diamond Button Visible')
		.setDesc("Keys: D or 3")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.diamondVisable)
		.onChange(async (value) => {
			this.plugin.settings.diamondVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Ellipse Button Visible')
		.setDesc("Keys: E or 4")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.ellipseVisable)
		.onChange(async (value) => {
			this.plugin.settings.ellipseVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Arrow Button Visible')
		.setDesc("Keys: A or 5")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.arrowVisable)
		.onChange(async (value) => {
			this.plugin.settings.arrowVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Line Button Visible')
		.setDesc("Keys: P or 6")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.lineVisable)
		.onChange(async (value) => {
			this.plugin.settings.lineVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Draw Button Visible')
		.setDesc("Keys: X or 7")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.penVisable)
		.onChange(async (value) => {
			this.plugin.settings.penVisable = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Text Button Visible')
		.setDesc("Keys: T or 8")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.textVisable)
		.onChange(async (value) => {
			this.plugin.settings.textVisable = value;
			await this.plugin.saveSettings();
		}));
	}
}
