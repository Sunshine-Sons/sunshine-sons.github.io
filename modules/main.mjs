// Copyright © 2025 Sunshine Sons LLC. All rights reserved.

'use strict'

import {PageController} from './pageController.mjs'
import {HomePage} from './home.mjs'

function getPageKeyFromSearchParams() {
	const params = new URL(document.location.toString()).searchParams
	return params.get('key')
}

const pageController = new PageController({
	home: HomePage
})

pageController.init(getPageKeyFromSearchParams())
