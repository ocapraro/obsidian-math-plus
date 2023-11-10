import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, renderMath, finishRenderMath, loadMathJax, FileManager } from 'obsidian';
import { formatEquation } from "./parser";
import { renderCanvas } from "./excalidrawRenderer"
import $ from "jquery";

/**
 * TODO:
 * - [ ] Add align
 * - [ ] Add testing sheet
 * - [ ] Add fill types
 * - [ ] Add line size
 * - [ ] Add corner options

 * FIXME:
 * - [ ] Excalidraw plugin style conflict
 * - [ ] Fix side bar overlapping
 * - [ ] Change button color var to match updated
*/


interface MathPlusSettings {
	// Custom Path
	path:string;
	// Operators
	operators:string;
	// Colors
	color1:string;
	color2:string;
	color3:string;
	colorPicker:boolean;
	// Math Block Size
	minHeight:string;
	// Live Preview
	livePreview:boolean;
	// Metadata
	addDollars:boolean;
	idHidden:boolean;
	formattingHidden:boolean;
	// Excalidraw UI
	lockVisable: boolean;
	selectVisable: boolean;
	rectVisable: boolean;
	diamondVisable: boolean;
	ellipseVisable: boolean;
	arrowVisable: boolean;
	lineVisable: boolean;
	penVisable: boolean;
	textVisable: boolean;
	// Excalidraw Settings
	gridModeEndabled: boolean;
}

const DEFAULT_SETTINGS: MathPlusSettings = {
	// Custom Path
	path:``,
	// Operators
	operators: `[
			{
					"op":"\left{(",
					"format":"{("
			},
			{
					"op":"\right)",
					"format":")"
			},
			{
					"op":"\\)",
					"format":"{\\rparen"
			},
			{
					"op":"\\if",
					"format":"{\\text{if }}"
			},
			{
					"op":"\\then",
					"format":"{\\text{then }}"
			},
			{
					"op":"\\or",
					"format":"{\\text{ or }}"
			},
			{
					"op":"!",
					"format":"{%s1%!}"
			},
			{
					"op":"/",
					"format":"\\frac{%s1%}{%s2%}"
			},
			{
					"op":"\\lim",
					"format":"\\lim_{%s1%\\to%s2%}"
			},
			{
					"op":"\\abs",
					"format":"{|%s2%|}"
			},
			{
					"op":"\\is",
					"format":"\\sum\\limits_{n=%s2%}^{\\infty}"
			}
	]`,

	// Colors
	color1:"#000000",
	color2:"#1864ab",
	color3:"#d9480f",
	colorPicker:false,
	// Math Block Size
	minHeight:"100",
	// Live Preview
	livePreview:false,
	// Metadata
	addDollars:false,
	idHidden:false,
	formattingHidden:true,
	// Excalidraw UI
	lockVisable: true,
	selectVisable: true,
	rectVisable: false,
	diamondVisable: false,
	ellipseVisable: false,
	arrowVisable: true,
	lineVisable: true,
	penVisable: true,
	textVisable: true,
	// Excalidraw Settings
	gridModeEndabled: false
}

const createViewer = (operators: string) => {
	if($(".HyperMD-codeblock-begin").text()==="```math") {
		updateLatexViewer(operators);
	}
}

const hideMetaData = () => {
	$(".HyperMD-codeblock:contains('%34o$$%34c')").css({display:"none"});
}

const hideId = () => {
	$(".HyperMD-codeblock:contains('||{\"id\":')").next(".HyperMD-codeblock:has(br)").hide();
	$(".HyperMD-codeblock:contains('||{\"id\":')").css({display:"none"});
}

const removeViewer = function() {
	if($(this).children().first().hasClass("block-language-math") && $(".HyperMD-codeblock-begin").length<1){
		$(".livePrevPlus").parents(".cm-html-embed").prev().remove();
		$(".livePrevPlus").parents(".cm-html-embed").remove();
	}
}

let filterTimeout: any;

const updateLatexViewer = async(operators: string)=>{
	clearTimeout(filterTimeout);

	filterTimeout = setTimeout(async() => {
		let fullText = "";
		let lines = $(".HyperMD-codeblock").not(".HyperMD-codeblock-begin").not(".HyperMD-codeblock-end");
		lines.each(function() {
			fullText+="\n"+($(this).text()||"\n");
		});
		let rawEqu = fullText.replace(/\|\|.+\|\|\n*/gm,"").replace(/%34o.+%34c\n*/gm,"");
		let equ = formatEquation(rawEqu, operators);

		let mdBlockEnd = document.querySelector(".HyperMD-codeblock-end");
		let livePrevPlus = $(".livePrevPlus");
		let previewHTML = "\n<div tabindex='-1'contenteditable='false' class='livePrevPlus'></div>";
		livePrevPlus.length>0?livePrevPlus.parents(".cm-html-embed").prev().remove():null;
		livePrevPlus.length>0?livePrevPlus.parents(".cm-html-embed").remove():null;
		mdBlockEnd.insertAdjacentText("afterend", previewHTML);
		setTimeout(async() => {
			$(".livePrevPlus").parents(".cm-html-embed").addClass("livePrevPlusBox");
			let prevBox = document.querySelector(".livePrevPlusBox")  as HTMLElement;
			// prevBox.style.cursor = "default";
		}, 150);
		setTimeout(async() => {
			if($(".livePrevPlus")){
				$(".livePrevPlus").empty();
				$(".livePrevPlus").append(renderMath(equ, true));
				await finishRenderMath();
			}
		}, 150);

	}, 10);
}

export default class MathPlus extends Plugin {
	settings: MathPlusSettings;

	async onload() {
		await this.loadSettings();
		await loadMathJax();
		const livePreviewEnabled = this.settings.livePreview;
		const formattingHidden = this.settings.formattingHidden;
		const idHidden = this.settings.idHidden;
		const operators = this.settings.operators;
		const tools = [
			this.settings.selectVisable,
			this.settings.rectVisable,
			this.settings.diamondVisable,
			this.settings.ellipseVisable,
			this.settings.arrowVisable,
			this.settings.lineVisable,
			this.settings.penVisable,
			this.settings.textVisable
		]
		const toolCount = tools.filter(Boolean).length;
		
		// Set Path
		this.settings.path = this.settings.path.length>0?this.settings.path:this.app.vault.configDir+`/plugins/obsidian-math-plus`;
		await this.saveSettings();
		const pluginPath = this.settings.path+"/";

		// Save Variable styles
		$("<style>").text(`
		.min-height-true { min-height:${this.settings.minHeight}px}
		.excalidraw-canvas-wrapper .small-canvas section .Island.App-toolbar:hover { max-width: ${15+(45*toolCount)}px; }
		`).appendTo("head");
			

			const saveToFile = async (fileName:string, data:string, directory:string, closeDrawing=true) => {
				const vault = this.app.vault;
				const adapter = vault.adapter;
				let directoryPath =  pluginPath+directory;
				// If the directory isn't there, make it
				if(!await adapter.exists(directoryPath)){
					await adapter.mkdir(directoryPath);
				}
				const configPath = `${directoryPath}/${fileName}`;
				if(await adapter.exists(configPath)){
					await adapter.write(configPath,data);
				}else{
					await vault.create(configPath,data);
				}
			}

		const readFile = async (fileName:string, directory:string) => {
			const configPath = `${pluginPath}${directory}/${fileName}`;
			if(await this.app.vault.adapter.exists(configPath)){
				return await this.app.vault.adapter.read(configPath);
			}
			return null
		}

		const objToCss = (obj:any) =>{
			return Object.entries(obj).map(([k, v]) => `${k} {${Object.entries(v).map(([k, v]) =>`${k}:${v}`).join(';')}}`).join('')
		}

		// Load Block Styles
		let blockStylesRaw = await readFile("block-styles","block-data")||"{}";
		let blockStyles = JSON.parse(blockStylesRaw);
		$("<style id='block-styles'>").text(objToCss(blockStyles)).appendTo("head");

		const updateBlockStyle = (id:string,key:string,value:string)=>{
			if(blockStyles.hasOwnProperty(`.math-block-${id}`)){
				if(blockStyles[`.math-block-${id}`][key]!==value){
					blockStyles[`.math-block-${id}`][key] = value;
					saveToFile("block-styles",JSON.stringify(blockStyles),"block-data");
					$("#block-styles").remove();
					$("<style id='block-styles'>").text(objToCss(blockStyles)).appendTo("head");
				}
			}else{
				blockStyles[`.math-block-${id}`] = {
					[key]:value,
				}
				saveToFile("block-styles",JSON.stringify(blockStyles),"block-data");
				$("#block-styles").remove();
				$("<style id='block-styles'>").text(objToCss(blockStyles)).appendTo("head");
			}
		}


		$(function() {
			let lastHeight = 0;
			if(livePreviewEnabled){
				$("body").on('DOMSubtreeModified', ".HyperMD-codeblock", function(){
					createViewer(operators);
				});
		
				$("body").on('DOMNodeInserted', ".cm-preview-code-block.cm-embed-block.markdown-rendered", removeViewer);
			}
			if(formattingHidden) {
				$("body").on('DOMNodeInserted', ".HyperMD-codeblock", hideMetaData);
			}
			if(idHidden) {
				$("body").on('DOMNodeInserted', ".HyperMD-codeblock", hideId);
			}

			$("body").on("mousedown", ".block-language-math", function(){
				lastHeight=$(this).height();
			});

			$("body").on("mouseup", ".block-language-math", function(){
				// if($(this).height()<=parseFloat($(this).css("min-height"))){
				// 	$(this).css("min-height",0);
				// }
				if(lastHeight!==$(this).height()){
					const id=$(this).attr('class').match(/math-block-[0-9]+/gm)[0].replace(/math-block-/gm,"");
					updateBlockStyle(id,"height",`${$(this).height()}px`);
					$(this).addClass("user-sized");
				}
			});
			// $("body").on('DOMNodeInserted', ".HyperMD-codeblock", function() {
			// 	if($(".HyperMD-codeblock-begin").text()==="```math") {
			// 		let livePrevPlus = $(".livePrevPlus");
			// 		if($(".HyperMD-codeblock-begin").length<1 && livePrevPlus.length>0) {
			// 			livePrevPlus.parents(".cm-html-embed").remove()
			// 		}
			// 		updateLatexViewer();
			// 	}
			// });
			// $("body").on('DOMSubtreeModified', function() {
			// 	let livePrevPlus = $(".livePrevPlus");
			// 	if($(".HyperMD-codeblock-begin").length<1 && livePrevPlus.length>0) {
			// 		livePrevPlus.parents(".cm-html-embed").prev().remove();
			// 		livePrevPlus.parents(".cm-html-embed").remove();
			// 	}
			// });
		});

		this.registerMarkdownCodeBlockProcessor("math", async (source, el, ctx) => {
			const parser = new DOMParser();
			const vault = this.app.vault;
			const adapter = vault.adapter;

			const saveToFile = async (fileName:string, data:string, directory:string, closeDrawing=true) => {
				let directoryPath = pluginPath+directory;
				// If the drawings directory isn't there, make it
				if(!await adapter.exists(directoryPath)){
					await adapter.mkdir(directoryPath);
				}
				const configPath = `${pluginPath}${directory}/${fileName}`;
				if(await adapter.exists(configPath)){
					await adapter.write(configPath,data);
				}else{
					await vault.create(configPath,data);
				}
				if(await adapter.exists(configPath)){
					if(closeDrawing){
						let svgData = await adapter.read(configPath);
						el.querySelector(".excalidraw-canvas-wrapper").replaceWith(parser.parseFromString(`<div class="math-svg-wrapper" style="width:${(el.querySelector("mjx-container mjx-math").clientWidth?el.querySelector("mjx-container mjx-math").clientWidth+"px":"100%")};">${svgData.replace(/viewBox="[0-9 .]+"/,"")}</div>`, "text/html").body.querySelector("div"));
						drawButton.show();
						doneButton.hide();
						new Notice("Saved");
					}
				}
			}

			const readFile = async (fileName:string, directory:string) => {
				const configPath = `${pluginPath}${directory}/${fileName}`;
				if(await adapter.exists(configPath)){
					return await adapter.read(configPath);
				}
				return null
			}

			// Parse Equation
			let rawEqu = source.replace(/\|\|.+\|\|\n*/gm,"").replace(/%34o.+%34c\n*/gm,"");;
			let equ = formatEquation(rawEqu, operators);

			// Render Equation
			el.append(renderMath(equ, true));
			await finishRenderMath();

			// Render Excalidraw
			let blockOptions = source.match(/\|\|.+\|\|/gm)?JSON.parse(source.match(/\|\|.+\|\|/gm)[0].replace(/\|\|/gm,"")):null;
			let blockId: number;
			if(blockOptions) {
				blockId = blockOptions.id;
			}
			const configPath = `${pluginPath}drawings/data-${blockId}.svg`;
			if(await adapter.exists(configPath)){
				let svgData = await adapter.read(configPath);
				el.append(parser.parseFromString(`<div class="math-svg-wrapper" style="width:${(el.querySelector("mjx-container mjx-math").clientWidth?el.querySelector("mjx-container mjx-math").clientWidth+"px":"100%")};">${svgData.replace(/viewBox="[0-9 .]+"/,"")}</div>`, "text/html").body.querySelector("div"));
			}

			// add id class to block
			el.addClass("math-block-"+blockId);

			// hide snap button if fit content
			if(blockStyles.hasOwnProperty(`.math-block-${blockId}`)){
				if(blockStyles[`.math-block-${blockId}`]["height"]!=="fit-content"){
					el.addClass("user-sized");
				}
			}

			// Hide Buttons
			this.settings.lockVisable?null:el.addClass("no-lock");
			this.settings.selectVisable?null:el.addClass("no-select");
			this.settings.rectVisable?null:el.addClass("no-rect");
			this.settings.diamondVisable?null:el.addClass("no-diamond");
			this.settings.ellipseVisable?null:el.addClass("no-ellipse");
			this.settings.arrowVisable?null:el.addClass("no-arrow");
			this.settings.lineVisable?null:el.addClass("no-line");
			this.settings.penVisable?null:el.addClass("no-pen");
			this.settings.textVisable?null:el.addClass("no-text");

			// Set Math Block Minimum Height
			el.addClass(`min-height-true`);


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

			// Add Snap Button
			const resizeIcon = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M128 320H32c-17.69 0-32 14.31-32 32s14.31 32 32 32h64v64c0 17.69 14.31 32 32 32s32-14.31 32-32v-96C160 334.3 145.7 320 128 320zM416 320h-96c-17.69 0-32 14.31-32 32v96c0 17.69 14.31 32 32 32s32-14.31 32-32v-64h64c17.69 0 32-14.31 32-32S433.7 320 416 320zM320 192h96c17.69 0 32-14.31 32-32s-14.31-32-32-32h-64V64c0-17.69-14.31-32-32-32s-32 14.31-32 32v96C288 177.7 302.3 192 320 192zM128 32C110.3 32 96 46.31 96 64v64H32C14.31 128 0 142.3 0 160s14.31 32 32 32h96c17.69 0 32-14.31 32-32V64C160 46.31 145.7 32 128 32z"/></svg>`, 'text/html');
			const resizeButton = editButtonGroup.createEl("div",{ cls: "math-button snap-button"});
			resizeButton.append(resizeIcon.body.querySelector("svg"));
			resizeButton.setAttr("aria-label","Snap to LaTex");
			resizeButton.onClickEvent(()=>{
				// el.style.minHeight=null;
				el.style.height="fit-content";
				el.removeClass("user-sized");
				updateBlockStyle(`${blockId}`,"height",`fit-content`)
			});

			// Add Draw Button Onclick
			drawButton.append(drawIcon.body.querySelector("svg"));
			drawButton.setAttr("aria-label","Draw on Block");
			drawButton.onClickEvent(async ()=>{
				const wrapper = el.createEl("div",{cls:"excalidraw-canvas-wrapper"});
				el.addClass("editing");
				el.scrollLeft=0;
				if(el.clientHeight<=parseInt(this.settings.minHeight)){
					el.addClass("small-math-block")
				}
				this.settings.colorPicker?null:wrapper.addClass("hidden-color-picker");
				let data =  await readFile("data-"+blockId+".json", "excalidraw-files");
				renderCanvas(wrapper, blockId, saveToFile, this.settings.gridModeEndabled, [this.settings.color1,this.settings.color2,this.settings.color3],readFile,data);
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
				el.removeClass("editing");
				if(saveButton) {
					saveButton.click();
				}else{
					let svgData = await adapter.read(configPath);
					el.querySelector(".excalidraw-canvas-wrapper").replaceWith(parser.parseFromString(`<div class="math-svg-wrapper" style="width:${(el.querySelector("mjx-container mjx-math").clientWidth?el.querySelector("mjx-container mjx-math").clientWidth+"px":"100%")};">${svgData.replace(/viewBox="[0-9 .]+"/,"")}</div>`, "text/html").body.querySelector("div"));
					drawButton.show();
					doneButton.hide();
					new Notice("Saved");
					
				}
			});
			doneButton.hide();
    });

		// Add insert math block command
		this.addCommand({
      id: "insert-math-block",
      name: "Insert math block",
			hotkeys: [{ modifiers: ["Mod"], key: "m" }],
      editorCallback: (editor: Editor) => {
				let id = Math.floor(Math.random() * Date.now());
        editor.replaceRange("```math\n"+(this.settings.addDollars?"%34o$$%34c\n":"")+"||{\"id\":"+id+"}||\n\n\n"+(this.settings.addDollars?"%34o$$%34c\n":"")+"```\n", editor.getCursor());
				editor.setCursor(editor.getCursor().line+3+(this.settings.addDollars?1:0));
      },
    });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MathPlusSettingTab(this.app, this));
	}

	onunload() {
		$("body").off('DOMSubtreeModified', ".HyperMD-codeblock");

		$("body").off('DOMNodeInserted', ".cm-preview-code-block.cm-embed-block.markdown-rendered", removeViewer);

		$("body").off('DOMNodeInserted', ".HyperMD-codeblock", hideMetaData);

		$("body").off('DOMNodeInserted', ".HyperMD-codeblock", hideId);

		$("body").off("mouseup", ".block-language-math");
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

		// Custom Path
		new Setting(containerEl)
		.setName('Save Data Path')
		.setDesc("Change the default path to save drawing data.")
		.addText(text => text
		.setValue(this.plugin.settings.path)
		.onChange(async (value) => {
			this.plugin.settings.path = value;
			await this.plugin.saveSettings();
		}));

		// Shortcuts
		containerEl.createEl('h3', {text: 'Shortcuts'});

		new Setting(containerEl)
		.setName('Shortcuts')
		.setDesc("Shortcuts to be parsed when writing in math blocks. Check out the ")
		.addTextArea(text => text
		.setValue(this.plugin.settings.operators)
		.onChange(async (value) => {
			this.plugin.settings.operators = value;
			await this.plugin.saveSettings();
		}))
		.setClass("big-text-area")
		.addButton(button => button
		.setButtonText("Update")
		.onClick(()=>{
			window.location.reload();
		})
		)
		.descEl
		.createEl('a', {text: 'github README ',href:"https://github.com/ocapraro/obsidian-math-plus#readme"})
		.parentElement.createEl('span', {text: 'for a guide.'})
		;


		// Colors
		containerEl.createEl('h3', {text: 'Colors'});

		new Setting(containerEl)
		.setName('Color 1')
		.addText(text => text
		.setValue(this.plugin.settings.color1)
		.onChange(async (value) => {
			this.plugin.settings.color1 = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Color 2')
		.addText(text => text
		.setValue(this.plugin.settings.color2)
		.onChange(async (value) => {
			this.plugin.settings.color2 = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Color 3')
		.addText(text => text
		.setValue(this.plugin.settings.color3)
		.onChange(async (value) => {
			this.plugin.settings.color3 = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Color Picker')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.colorPicker)
		.onChange(async (value) => {
			this.plugin.settings.colorPicker = value;
			await this.plugin.saveSettings();
		}));


		// Math Block Size
		containerEl.createEl('h3', {text: 'Math Block Size'});
		
		new Setting(containerEl)
		.setName('Minimum Block Height')
		.addText(text => text
		.setValue(this.plugin.settings.minHeight)
		.onChange(async (value) => {
			this.plugin.settings.minHeight = value;
			await this.plugin.saveSettings();
		}));

		// Live Preview
		containerEl.createEl('h3', {text: 'Live Preview'});

		new Setting(containerEl)
		.setName('Live Preview (Beta)')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.livePreview)
		.onChange(async (value) => {
			this.plugin.settings.livePreview = value;
			await this.plugin.saveSettings();
		}));

		// Metadata
		containerEl.createEl('h3', {text: 'Metadata'});

		new Setting(containerEl)
		.setName('Add Dollar Signs')
		.setDesc("Wraps the code blocks in $$ for cross plugin support with plugins like ")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.addDollars)
		.onChange(async (value) => {
			this.plugin.settings.addDollars = value;
			await this.plugin.saveSettings();
		})).descEl.createEl('a', {text: 'Completr',href:"https://obsidian.md/plugins?id=obsidian-completr"});

		new Setting(containerEl)
		.setName('Hide ID')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.idHidden)
		.onChange(async (value) => {
			this.plugin.settings.idHidden = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('Hide Formatting')
		.setDesc("Hides formatting within math blocks")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.formattingHidden)
		.onChange(async (value) => {
			this.plugin.settings.formattingHidden = value;
			await this.plugin.saveSettings();
		}));

		// Excalidraw UI
		containerEl.createEl('h3', {text: 'Excalidraw UI'});

		new Setting(containerEl)
		.setName('Lock Button Visible')
		.setDesc("Key: Q")
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.lockVisable)
		.onChange(async (value) => {
			this.plugin.settings.lockVisable = value;
			await this.plugin.saveSettings();
		}));
		
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


		// Excalidraw Settings
		containerEl.createEl('h3', {text: 'Excalidraw Settings'});

		new Setting(containerEl)
		.setName('Grid Mode')
		.addToggle(toggle => toggle
		.setValue(this.plugin.settings.gridModeEndabled)
		.onChange(async (value) => {
			this.plugin.settings.gridModeEndabled = value;
			await this.plugin.saveSettings();
		}));
	}
}
