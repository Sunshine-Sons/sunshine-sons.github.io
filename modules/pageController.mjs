// Copyright © 2025 Sunshine Sons LLC. All rights reserved.

'use strict'

import {assignIf, checkMobile, DynamicColor, onKeyDown, openInNewTab, phi, tau, toggleFullscreen} from './util.mjs'
import {Application, Assets, Container, FillGradient, Graphics, RenderTexture, Sprite, SCALE_MODES, Text, Texture} from './pixi.min.mjs'
import {AdvancedBloomFilter, AsciiFilter, BevelFilter, DropShadowFilter, GlowFilter, GodrayFilter, OutlineFilter} from './pixi-filters.mjs'

export class PageController {
	#pageClasses = null
	#pages = {}
	#currentPage = null
	#isMobile = checkMobile()
	#settings = {}
	#app = new Application()
	#textures = {}
	#filters = {}
	#dynamicColors = []
	#storyText = null
	#loading = null
	#backgroundContainer = null
	#backgroundGradient = null
	#backgroundRectangle = null
	#clouds = []
	#ground = null
	#leaves = []
	#fadeRectangle = null
	#controllerUiContainer = null
	#pageContainer = null
	#unexpand = null
	#expand = null
	#facebook = null
	#youtube = null
	#phone = null
	#mouseX = 0
	#mouseY = 0
	#scale = 1
	#paused = false
	#totalTime = 0
	
	#pageFade = {
		nextPage: null,
		fadeIn: false,
		elapsed: 0
	}
	
	titleAccel = 0
	glowAccel = 0
	sloganAccel = 0
	
	constructor(pageClasses) {
		this.#pageClasses = pageClasses
	}
	
	get isMobile() { return this.#isMobile }
	get mediaDirectory() { return '../media/' }
	get overlayAlpha() { return 0.5 }
	get storyText() { return this.#storyText }
	get mouseX() { return this.#mouseX }
	get mouseY() { return this.#mouseY }
	get screenWidth() { return this.#app.screen.width }
	get screenHeight() { return this.#app.screen.height }
	get centerX() { return this.#app.screen.width / 2 }
	get centerY() { return this.#app.screen.height / 2 }
	get isHorizontalDisplay() { return this.screenWidth >= this.screenHeight }
	get scale() { return this.#scale }
	
	getFilter(key) { return this.#filters[key] }
	getDynamicColor(index) { return this.#dynamicColors[index] }
	
	async init(pageKey) {
		assignIf(this.#settings, {
			pauseEnabled: false,
			hideUi: false
		})
		
		await this.#loadResources()
		this.#createBaseGraphics()
		await this.loadPage(pageKey)
		this.#setAppCallbacks()
	}
	
	async #loadResources() {
		const app = this.#app
		
		await app.init({
			background: '#000000',
			resizeTo: window,
			preference: 'webgpu',
			antialias: true,
			autoDensity: true,
			resolution: window.devicePixelRatio,
			powerPreference: 'high-performance'
		})
		
		document.body.appendChild(app.canvas)
		
		Assets.addBundle('fonts', [
			{alias: 'Ezydraw', src: this.mediaDirectory + 'Ezydraw.ttf'}
		])
		
		await Assets.loadBundle('fonts')
		
		const storyText = new Text({
			text: '',
			style: {
				fontFamily: 'Ezydraw',
				fontSize: 100,
				fill: 0xffffff,
				//stroke: {color: '#000000', width: 30, join: 'round'},
				align: 'center',
				lineHeight: 130,
				//lineHeight: 'normal'
				margin: 30
			}
		})
		
		storyText.anchor.set(0.5)
		this.#storyText = storyText
		
		await this.loadTexture('loading')
		const loading = this.newSprite('loading')
		this.#loading = loading
		this.#recalculateScale()
		loading.position.set(this.centerX, this.centerY)
		loading.scale.set(this.#scale)
		app.ticker.add((time) => loading.rotation += time.deltaTime * 0.1)
		
		await this.loadTextures('expand', 'unexpand', 'facebook', 'phone', 'youtube', 'TM', 'arrow', 'ground',
			'cloud1', 'leaf1', 'leaf2', 'leaf3', 'leaf4')
	}
	
	#createBaseGraphics() {
		const backgroundContainer = this.newContainer()
		
		this.#backgroundContainer = backgroundContainer
		backgroundContainer.visible = false
		this.#backgroundGradient = new FillGradient(0, 0, 1, 1)
		this.#backgroundGradient.addColorStop(0, 0x80d7fa)
		this.#backgroundGradient.addColorStop(1, 0x92e8fa)
		this.#backgroundRectangle = this.newGraphics(backgroundContainer)
		
		for (let i = 0; i < 8; ++i) {
			this.#clouds.push(this.newSprite('cloud1', backgroundContainer))
		}
		
		this.#ground = this.newSprite('ground', backgroundContainer)
		
		for (let i = 0; i < 8; ++i) {
			this.#leaves.push(this.newSprite('leaf' + ((i % 4) + 1), backgroundContainer))
		}
		
		const controllerUiContainer = this.newContainer()
		
		this.#controllerUiContainer = controllerUiContainer
		controllerUiContainer.visible = false
		this.#expand = this.newSprite('expand', controllerUiContainer)
		this.#unexpand = this.newSprite('unexpand', controllerUiContainer)
		this.#facebook = this.newSprite('facebook', controllerUiContainer)
		this.#youtube = this.newSprite('youtube', controllerUiContainer)
		this.#phone = this.newSprite('phone', controllerUiContainer)
		
		this.#pageContainer = this.newContainer()
		this.#fadeRectangle = this.newGraphics()
		this.#loading.removeFromParent()
		this.addChild(this.#loading)
		
		this.addFilter('bevel', new BevelFilter())
		this.addFilter('asciiSmall', new AsciiFilter({size: 4, replaceColor: true}))
		this.addFilter('bloom', new AdvancedBloomFilter({threshold: 0.1}))
		this.addFilter('glow', new GlowFilter())
		this.addFilter('godray', new GodrayFilter({parallel: false}))
		this.addFilter('dropShadow', new DropShadowFilter())
		this.addFilter('outline', new OutlineFilter({color: 0x000000, thickness: this.isMobile ? 3 : 6}))
		
		this.setFilters(this.#backgroundRectangle, 'godray')
		this.#clouds.forEach((cloud) => this.setFilters(cloud, 'dropShadow'))
		this.#leaves.forEach((leaf) => this.setFilters(leaf, 'dropShadow'))
		this.setFilters(this.#ground, 'outline')
		this.setFilters(this.#expand, 'glow', 'dropShadow')
		this.setFilters(this.#unexpand, 'glow', 'dropShadow')
		this.setFilters(this.#facebook, 'glow', 'dropShadow')
		this.setFilters(this.#youtube, 'glow', 'dropShadow')
		this.setFilters(this.#phone, 'glow', 'dropShadow')
		
		this.#pushNewDynamicColor({
			r: {velocity: 1},
			g: {velocity: 1.5},
			b: {velocity: 4 / 3},
			elapse: 8
		})
		
		this.#pushNewDynamicColor({
			r: {velocity: 1.5},
			g: {velocity: 4 / 3},
			b: {velocity: 1},
			elapse: 8
		})
		
		this.#pushNewDynamicColor({
			r: {velocity: 4 / 3},
			g: {velocity: 1},
			b: {velocity: 1.5},
			elapse: 8
		})
		
		this.#pushNewDynamicColor({
			r: {velocity: 9 / 7},
			g: {velocity: 13 / 9},
			b: {velocity: 139 / 126},
			elapse: 8
		})
		
		this.onClick(this.#expand, toggleFullscreen)
		this.onClick(this.#unexpand, toggleFullscreen)
		this.onClick(this.#facebook, () => openInNewTab('https://www.facebook.com/profile.php?id=61573931223596'))
		this.onClick(this.#youtube, () => openInNewTab('https://www.youtube.com/@SunshineSonsLLC'))
		this.onClick(this.#phone, () => window.open('tel:630-506-6700'))
		
		// disable all interaction underneath fadeRectangle
		this.#fadeRectangle.eventMode = 'static'
	}
	
	#setAppCallbacks() {
		const app = this.#app
		const stage = app.stage
		
		stage.eventMode = 'static'
		stage.hitArea = app.screen
		
		stage.addEventListener('pointermove', (e) => {
			this.#mouseX = e.global.x
			this.#mouseY = e.global.y
		})
		
		if (this.#settings.pauseEnabled) {
			onKeyDown((keyCode) => {
				if (keyCode == 80) {
					this.#paused = !this.#paused
				}
			})
		}
		
		app.renderer.on('resize', () => this.#layout(false))
		app.ticker.add((time) => this.#update(time))
	}
	
	#getPageKey(key) {
		key = key ? key.toLowerCase() : 'home'
		return this.#pageClasses[key] ? key : 'home'
	}
	
	// Lazy initialization, cache pages once they are created
	async #getPage(key) {
		const pages = this.#pages
		let page = pages[key]
		
		if (page == null) {
			const pageClass = this.#pageClasses[key]
			
			this.#loading.visible = true
			this.#fadeRectangle.visible = true
			this.#fadeRectangle.alpha = 0.5
			page = new pageClass(this)
			pages[key] = page
			await page.initBase()
		}
		
		return page
	}
	
	async loadPage(key) {
		key = this.#getPageKey(key)
		
		const page = await this.#getPage(key)
		const pageFade = this.#pageFade
		
		pageFade.nextPage = page
		pageFade.elapsed = 0
		
		if (this.#currentPage == null) {
			this.#setPage(page)
		}
		
		this.#backgroundContainer.visible = true
		this.setUiVisibility(this.#controllerUiContainer)
		window.history.replaceState('', '', '?key=' + key)
	}
	
	#setPage(page) {
		this.#pageContainer.removeChildren()
		this.#currentPage = page
		this.#pageContainer.addChild(page.container)
		page.reload()
		this.#layout(true)
		this.#loading.visible = false
	}
	
	#updatePageFade(dt) {
		const pageFade = this.#pageFade
		const nextPage = pageFade.nextPage
		
		if (nextPage == null) {
			return
		}
		
		const fadingOut =  this.#currentPage !== nextPage
		const fadeRectangle = this.#fadeRectangle
		
		fadeRectangle.visible = true
		fadeRectangle.alpha = fadingOut ? pageFade.elapsed : 1 - pageFade.elapsed
		pageFade.elapsed += 0.025 * dt
		
		if (pageFade.elapsed >= 1) {
			pageFade.elapsed = pageFade.elapsed % 1
			
			if (fadingOut) {
				this.#setPage(nextPage)
			} else {
				pageFade.nextPage = null
				fadeRectangle.visible = false
				return
			}
		}
	}
	
	async loadTexture(key) {
		if (this.#textures[key] != null) {
			return
		}
		
		const path = this.mediaDirectory + key + '.png'
		const texture = await Assets.load(path)
		texture.source.antialias = true
		texture.source.scaleMode = SCALE_MODES.LINEAR
		this.#textures[key] = texture
	}
	
	async loadTextures(...keys) {
		for (const key of keys) {
			await this.loadTexture(key)
		}
	}
	
	#pushNewDynamicColor(args) {
		this.#dynamicColors.push(new DynamicColor(args))
	}
	
	addFilter(key, filter, mobileResolution) {
		this.#filters[key] = filter
		filter.resolution = mobileResolution != null && this.isMobile ? mobileResolution : window.devicePixelRatio
	}
	
	setFilters(displayObject, ...filterKeys) {
		displayObject.filters = filterKeys.map((key) => this.#filters[key])
	}
	
	addChild(displayObject, container) {
		(container || this.#app.stage).addChild(displayObject)
		return displayObject
	}
	
	newSprite(textureKey, container, alpha) {
		const result = new Sprite(this.#textures[textureKey])
		result.anchor.set(0.5)
		result.alpha = alpha == null ? 1 : alpha
		return this.addChild(result, container)
	}
	
	newGraphics(container) {
		return this.addChild(new Graphics(), container)
	}
	
	newContainer(parentContainer) {
		return this.addChild(new Container(), parentContainer)
	}
	
	newStoryText(str) {
		// Render text to a texture, because there was some latency seen on mobile otherwise
		
		const text = this.#storyText
		text.text = str
		text.position.set(text.width / 2, text.height / 2)
		
		const renderTexture = RenderTexture.create({width: text.width, height: text.height})
		renderTexture.source.antialias = true
		renderTexture.source.scaleMode = SCALE_MODES.LINEAR
		this.#app.renderer.render(text, {renderTexture})
		
		const result = new Sprite(renderTexture)
		result.anchor.set(0.5)
		this.setFilters(result, 'outline', 'glow', 'dropShadow')
		
		return result
	}
	
	onClick(displayObject, callback) {
		displayObject.eventMode = 'static'
		displayObject.cursor = 'pointer'
		displayObject.on('pointerdown', callback)
	}
	
	 addOnce(callback) {
		this.#app.ticker.addOnce(callback)
	 }
	
	position(displayObject, xPercent, yPercent, scale) {
		const baseScale = this.#scale
		
		displayObject.position.set(xPercent * this.centerX / baseScale, yPercent * this.centerY / baseScale)
		displayObject.scale.set(scale == null ? 1 : scale)
		
		return displayObject
	}
	
	setUiVisibility(displayObject) {
		displayObject.visible = !this.#settings.hideUi
	}
	
	#recalculateScale() {
		const scale = this.isHorizontalDisplay ? this.screenHeight / 2048 : 0.85 * this.screenWidth / 2103
		this.#scale = scale
		return scale
		
	}
	
	arrangeUi(args) {
		assignIf(args, {
			align: 'center',
			x: 0,
			y: 0,
			spacing: 10,
			scale: 1,
			elements: []
		})
		
		const elements = args.elements.map((element) => {
			if (Array.isArray(element)) {
				return {
					object: element[0],
					scale: element[1]
				}
			}
			
			return {
				object: element,
				scale: 1
			}
		})
		
		const align = args.align
		const numElements = elements.length
		const x = args.x
		const y = args.y
		const mainScale = this.scale
		const scale = args.scale
		const spacing = args.spacing
		let left = 0
		
		elements.forEach((element) => {
			const object = element.object
			
			object.scale.set(scale * element.scale)
			
			const width = object.texture.width * object.scale.x
			
			left += width / 2
			object.position.set(left, y)
			left += width / 2 + spacing
		})
		
		if (align == 'center') {
			const middleIndex = Math.floor(numElements / 2)
			
			const centerX = numElements % 2 == 1 ?
				elements[middleIndex].object.x :
				(elements[middleIndex].object.x + elements[middleIndex - 1].object.x) / 2
			
			elements.forEach((element) => element.object.x -= centerX)
		} else if (align == 'right') {
			elements.forEach((element) => element.object.x -= left)
		}
		
		// align 'left' supported by default
		
		elements.forEach((element) => element.object.x += x)
	}
	
	#layoutQueued = false
	
	#layout(immediate) {
		if (!immediate) {
			if (this.#layoutQueued) {
				return
			}
			
			this.#layoutQueued = true
			
			setTimeout(() => {
				this.#layout(true)
				this.#layoutQueued = false
			}, 300)
			
			return
		}
		
		const screenWidth = this.screenWidth
		const screenHeight = this.screenHeight
		const centerX = this.centerX
		const centerY = this.centerY
		const scale = this.#recalculateScale()
		const isHorizontalDisplay = this.isHorizontalDisplay
		
		const resetRectangle = (rectangle, fill) => {
			rectangle.clear()
			rectangle.rect(0, 0, screenWidth, screenHeight).fill(fill)
		}
		
		resetRectangle(this.#backgroundRectangle, this.#backgroundGradient)
		resetRectangle(this.#fadeRectangle, 0x060606)
		
		this.#clouds.forEach((cloud, i) => {
			const numClouds = this.#clouds.length
			
			cloud.x = i * 2 * screenWidth / numClouds + Math.random() * 10
			cloud.y = i * screenHeight / numClouds % (screenHeight / 5) + Math.random() * 10
			cloud.baseY = cloud.y
			cloud.scale = Math.pow(screenWidth / 1920, 3 / 4)
			cloud.velocity = 0.5 * (i / 4 + 1 + Math.random()) * cloud.scale.x
		})
		
		this.#ground.position.set(centerX, screenHeight)
		this.#ground.width = screenWidth
		this.#ground.height = screenHeight * 0.25
		
		this.#leaves.forEach((leaf, i) => {
			const v = 1
			
			leaf.rv = 0
			leaf.elapsed = Math.random() * 15
			leaf.vx = -(Math.random() * v + v / 2)
			leaf.ySpeed = Math.random() * 0.25 + 0.25
			leaf.yDiff = Math.random() * screenHeight / 8 + 4
			leaf.baseY = Math.random() * screenHeight / 8 + 7 * screenHeight / 8
			leaf.x = Math.random() * 3 * centerX - centerX
			leaf.y = leaf.baseY
			leaf.rotation = Math.random() * tau
			leaf.scale = 0.5 * Math.pow(screenWidth / 1920, 0.5)
		})
		
		const controllerUiContainer = this.#controllerUiContainer
		const logoScale = 0.75
		const logoX = 0.085
		const logoY = 0.92
		
		controllerUiContainer.position.set(centerX, centerY)
		controllerUiContainer.scale.set(scale)
		
		for (const expander of [this.#unexpand, this.#expand]) {
			this.arrangeUi({
				align: 'right',
				y: -centerY / scale + (isHorizontalDisplay ? 75 : 125),
				x: centerX / scale - (isHorizontalDisplay ? 10 : 15),
				spacing: 40,
				scale: isHorizontalDisplay ? 0.2 : 0.4,
				elements: [expander]
			})
		}
		
		this.arrangeUi({
			align: 'center',
			y: centerY / scale - (isHorizontalDisplay ? 100 : 150),
			spacing: isHorizontalDisplay ? 50 : 75,
			scale: isHorizontalDisplay ? 0.75 : 1.35,
			elements: [
				[this.#facebook, 145 / 268],
				this.#youtube,
				[this.#phone, 145 / 268]
			]
		})
		
		const pageContainer = this.#pageContainer
		
		pageContainer.position.set(centerX, centerY)
		pageContainer.scale.set(scale)
		
		const filters = this.#filters
		
		filters.dropShadow.offsetX = 20 * scale
		filters.dropShadow.offsetY = 20 * scale
		filters.glow.outerStrength = 10 * scale
		filters.bloom.blur = 16 * scale
		filters.godray.center.x = screenWidth
		
		this.#loading.position.set(centerX, centerY)
		this.#loading.scale.set(scale)
		
		this.#currentPage.layoutBase(screenWidth / scale, screenHeight / scale, centerX / scale, centerY / scale, isHorizontalDisplay)
	}
	
	#update(time) {
		if (this.#paused) {
			time.deltaTime = 0
		}
		
		const dt = time.deltaTime
		const filters = this.#filters
		const page = this.#currentPage
		const dynamicColors = this.#dynamicColors
		const isFullscreen = document.fullscreen
		
		this.#totalTime += dt
		this.#expand.visible = !isFullscreen
		this.#unexpand.visible = isFullscreen
		
		dynamicColors[0].update(dt / 100 * (1 + this.titleAccel))
		dynamicColors[1].update(dt / 100 * (1 + this.glowAccel))
		dynamicColors[2].update(dt / 100 * (1 + this.sloganAccel))
		dynamicColors[3].update(dt / 100)
		
		this.titleAccel *= 0.99 - 0.001 * dt
		this.glowAccel *= 0.99 - 0.01 * dt
		this.sloganAccel *= 0.99 - 0.001 * dt
		
		filters.glow.color = dynamicColors[1].getInt()
		filters.godray.time += 0.01 * dt
		
		this.#clouds.forEach((cloud, i) => {
			cloud.x -= cloud.velocity * dt
			cloud.y = cloud.baseY + Math.sin(i + this.#totalTime / 100) * this.screenHeight / 20 * cloud.scale.y
			
			if (cloud.x + cloud.width / 2 <= 0) {
				cloud.x += this.screenWidth + cloud.width
			}
		})
		
		this.#leaves.forEach((leaf, i) => {
			leaf.elapsed += dt / 100
			leaf.x += leaf.vx * (Math.sin(leaf.elapsed) / 8 + 7 / 8)
			
			if (leaf.x + leaf.width / 2 < 0) {
				leaf.x = this.screenWidth + leaf.width
			}
			
			leaf.y = Math.floor(leaf.baseY + Math.sin(leaf.elapsed * leaf.ySpeed) * leaf.yDiff)
			
			leaf.rv = Math.sin(leaf.elapsed) / 40
			leaf.rotation = (leaf.rotation + leaf.rv) % tau
		})
		
		this.#updatePageFade(dt)
		page.updateBase(time, dt)
	}
}
