// Copyright © 2025 Sunshine Sons LLC. All rights reserved.

'use strict'

import {assignIf, phi, phi2} from './util.mjs'
import {Container} from './pixi.min.mjs'
import {PageController} from './pageController.mjs'

export class Page {
	#frameData = {
		animating: false,
		elapsed: 0,
		index: 0,
		nextIndex: null
	}
	
	#controller = null
	#container = new Container()
	#ui = []
	#story = null
	frameContainer = null
	
	constructor(controller) {
		this.#controller = controller
	}
	
	get controller() { return this.#controller }
	get container() { return this.#container }
	getDynamicColor(index) { return this.#controller.getDynamicColor(index) }
	
	async loadPage(key) {
		await this.#controller.loadPage(key)
	}
	
	#getContainer(container) {
		return container || this.#container
	}
	
	newSprite(textureKey, container, alpha) {
		return this.#controller.newSprite(textureKey, this.#getContainer(container), alpha)
	}
	
	newGraphics(container) {
		return this.#controller.newGraphics(this.#getContainer(container))
	}
	
	newContainer(parentContainer) {
		return this.#controller.newContainer(this.#getContainer(parentContainer))
	}
	
	onClick(displayObject, callback) {
		this.#controller.onClick(displayObject, callback)
	}
	
	addStory() {
		const story = this.#story
		
		if (story == null) {
			return
		}
		
		this.frameContainer.addChild(story)
	}
	
	#createStoryPart(part) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(this.#controller.newStoryText(part))
			})
		})
	}
	
	async #createStory(parts) {
		const story = new Container()
		
		story.isStory = true
		story.storyFrame = 0
		story.storyElapsed = 0
		
		this.#story = story
		
		for (const part of this.settings.story) {
			const text = await this.#createStoryPart(part)
			story.addChild(text)
		}
		
		this.onClick(story, () => {
			story.storyFrame = (story.storyFrame + 1) % story.children.length
			story.storyElapsed = 0
		})
	}
	
	setFilters(displayObject, ...filterKeys) {
		this.#controller.setFilters(displayObject, ...filterKeys)
	}
	
	async initBase() {
		const settings = assignIf(this.settings, {
			textures: [],
			title: 'title',
			slogan: 'slogan',
			tmTitle: false,
			tmSlogan: false,
			ui: [],
		})
		
		const controller = this.#controller
		
		await controller.loadTextures(settings.title, settings.slogan)
		await controller.loadTextures(...settings.textures)
		
		for (const element of settings.ui) { 
			const textureKey = element.texture
			const page = element.page
			await controller.loadTexture(textureKey)
			const sprite = this.newSprite(textureKey)
			this.setFilters(sprite, 'glow', 'dropShadow')
			this.onClick(sprite, () => this.loadPage(page))
			this.controller.setUiVisibility(sprite)
			this.#ui.push(sprite)
		}
		
		this.title1 = this.newSprite(settings.title)
		
		if (settings.tmTitle) {
			this.tmTitle = this.newSprite('TM', null, 0.125)
		}
		
		this.slogan1 = this.newSprite(settings.slogan)
		this.leftArrow = this.newSprite('arrow')
		this.rightArrow = this.newSprite('arrow')
		
		this.controller.setUiVisibility(this.leftArrow)
		this.controller.setUiVisibility(this.rightArrow)
		
		if (settings.tmSlogan) {
			this.tmSlogan = this.newSprite('TM', null, 0.125)
		}
		
		this.frameContainer = this.newContainer()
		
		this.setFilters(this.title1, 'glow', 'dropShadow')
		this.setFilters(this.slogan1, 'glow', 'dropShadow')
		this.setFilters(this.leftArrow, 'glow', 'dropShadow')
		this.setFilters(this.rightArrow, 'glow', 'dropShadow')
		
		if (settings.story != null) {
			await this.#createStory()
		}
		
		this.onClick(this.title1, () => {
			controller.getDynamicColor(0).update(1)
			this.#controller.titleAccel = 8
			this.#nextFrame(1)
		})
		
		const nextFrame = (offset) => {
			controller.getDynamicColor(2).update(1)
			this.#controller.sloganAccel = 8
			this.#nextFrame(offset)
		}
		
		this.onClick(this.slogan1, () => nextFrame(1))
		this.onClick(this.leftArrow, () => nextFrame(-1))
		this.onClick(this.rightArrow, () => nextFrame(1))
		
		this.init()
		this.#resetFrames()
	}
	
	init() {}
	
	reload() {
		this.#resetFrames()
	}
	
	position(displayObject, xPercent, yPercent, scale) {
		return this.#controller.position(displayObject, xPercent, yPercent, scale)
	}
	
	layoutBase(screenWidth, screenHeight, centerX, centerY, isHorizontalDisplay) {
		const titleF = phi + 0.05
		
		this.position(this.title1, 0, -phi)
		
		if (this.tmTitle) {
			this.tmTitle.position.set(this.title1.x + this.title1.width / 2 + 80, this.title1.y - this.title1.height * 0.4)
		}
		
		this.position(this.slogan1, 0, phi, 0.75)
		
		if (isHorizontalDisplay) {
			this.position(this.rightArrow, phi, 0, 0.5)
			this.position(this.leftArrow, -phi, 0, 0.5)
		} else {
			this.position(this.rightArrow, phi2, 0,  0.75)
			this.position(this.leftArrow, -phi2, 0, 0.75)
		}
		
		this.leftArrow.scale.x *= -1
		
		if (this.tmSlogan) {
			this.tmSlogan.position.set(this.slogan1.x + this.slogan1.width / 2 + 80, this.slogan1.y - this.slogan1.height * 0.4)
		}
		
		this.controller.arrangeUi({
			align: 'left',
			y: -centerY + (isHorizontalDisplay ? 150 : 200),
			x: -centerX + (isHorizontalDisplay ? 50 : 75),
			spacing: 40,
			scale: isHorizontalDisplay ? 0.2 : 0.3,
			elements: this.#ui
		})
		
		this.frameContainer.children.forEach((frame, index) => {
			if (frame.isStory) {
				frame.scale.set(isHorizontalDisplay ? 1 : 1.5)
			}
		})
		
		if (this.frameContainer.children.length <= 1) {
			this.rightArrow.visible = false
			this.leftArrow.visible = false
		}
		
		this.layout(screenWidth, screenHeight, centerX, centerY, isHorizontalDisplay)
	}
	
	layout(screenWidth, screenHeight, centerX, centerY, isHorizontalDisplay) {}
	
	#resetFrames() {
		const data = this.#frameData
		
		data.animating = false
		data.elapsed = 0
		data.index = 0
		data.nextIndex = null
		
		this.frameContainer.children.forEach((frame, index) => {
			frame.visible = index === 0
			
			if (frame.isStory) {
				frame.storyElapsed = 0
				frame.storyFrame = 0
			}
		})
	}
	
	#nextFrame(offset) {
		const data = this.#frameData
		const numFrames = this.frameContainer.children.length
		
		if (data.animating || numFrames <= 1) {
			return
		}
		
		data.animating = true
		data.elapsed = 0
		data.nextIndex = (data.index + offset) % numFrames
		
		if (data.nextIndex < 0) {
			data.nextIndex += numFrames
		}
	}
	
	#updateFrame(dt) {
		const frameData = this.#frameData
		
		if (frameData.animating) {
			frameData.elapsed += dt
			
			const elapsed = Math.min(2, frameData.elapsed * 0.1)
			const currentVisible = elapsed < 1
			const frameContainer = this.frameContainer
			const frames = frameContainer.children
			const nextFrame = frames[frameData.nextIndex]
			
			frameContainer.scale = Math.abs(elapsed - 1)
			frames[frameData.index].visible = currentVisible
			nextFrame.visible = !currentVisible
			
			if (nextFrame.isStory) {
				nextFrame.storyFrame = 0
				nextFrame.storyElapsed = 0
			}
			
			if (elapsed == 2) {
				frameData.animating = false
				frameData.index = frameData.nextIndex
				frameData.nextIndex = null
			}
		}
	}
	
	#updateStory(dt) {
		const frames = this.frameContainer.children
		
		for (const frame of frames) {
			if (frame.visible && frame.isStory) {
				const texts = frame.children
				
				if (texts.length == 0) {
					break
				}
				
				const frameTime = 3
				
				frame.storyElapsed += dt * 0.01
				
				if (frame.storyElapsed >= frameTime) {
					frame.storyElapsed = frame.storyElapsed % frameTime
					frame.storyFrame = (frame.storyFrame + 1) % texts.length
				}
				
				const text = texts[frame.storyFrame]
				
				for (const otherText of texts) {
					otherText.visible = otherText === text
				}
				
				const f = frame.storyElapsed / frameTime
				const fadeF = 1 - phi2
				const fadeIn = f < fadeF
				const fadeOut = f > phi2
				let alpha = 1
			
				if (fadeIn) {
					alpha = f / fadeF
				} else if(fadeOut) {
					alpha = (1 - f) / fadeF
				}
				
				text.alpha = alpha
				text.tint = this.getDynamicColor(3).getInt()
				
				break
			}
		}
	}
	
	updateBase(time, dt) {
		this.#updateFrame(dt)
		this.#updateStory(dt)
		this.update(time, dt)
	}
	
	update(time, dt) {}
}
