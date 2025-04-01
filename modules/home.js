// Copyright © 2025 Sunshine Sons LLC. All rights reserved.

'use strict'

import {Page} from './page.js'

export class HomePage extends Page {
	settings = {
		title: 'title',
		slogan: 'slogan',
		tmSlogan: true,
		story: [
			'Pressure Washing:\n\nSiding ✔\nFences/decks ✔\nDriveways ✔',
			'Lawn care:\n\nMowing ✔\nFertilizer ✔\nClean-up ✔',
			'Unbeatable\nintroductory\nrates!',
			'Book now!\n\nRequest a\nquote today!\n\n630-506-6700',
		]
	}
	
	init() {
		this.addStory()
	}
	
	layout(screenWidth, screenHeight, centerX, centerY, isHorizontalDisplay) {
		this.title1.scale.set(isHorizontalDisplay ? 0.7 : 1)
		this.slogan1.scale.set(isHorizontalDisplay ? 0.85 : 1)
		this.tmSlogan.position.set(this.slogan1.x + this.slogan1.width / 2 + 80, this.slogan1.y - this.slogan1.height * 0.4)
		
		const titleShadowOffset = this.title1.scale.x * 20
		const sloganShadowOffset = this.slogan1.scale.x * 20
		
		this.titleShadow.position.set(this.title1.x + titleShadowOffset, this.title1.y + titleShadowOffset)
		this.titleShadow.scale = this.title1.scale
		
		this.sloganShadow.position.set(this.slogan1.x + titleShadowOffset, this.slogan1.y + titleShadowOffset)
		this.sloganShadow.scale = this.slogan1.scale
	}
	
	update(time, dt) {}
}
