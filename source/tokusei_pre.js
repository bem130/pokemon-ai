/*

Ratings and how they work:

-1: Detrimental
	  An ability that severely harms the user.
	ex. Defeatist, Slow Start

 0: Useless
	  An ability with no overall benefit in a singles battle.
	ex. Color Change, Plus

 1: Ineffective
	  An ability that has minimal effect or is only useful in niche situations.
	ex. Light Metal, Suction Cups

 2: Useful
	  An ability that can be generally useful.
	ex. Flame Body, Overcoat

 3: Effective
	  An ability with a strong effect on the user or foe.
	ex. Chlorophyll, Sturdy

 4: Very useful
	  One of the more popular abilities. It requires minimal support to be effective.
	ex. Adaptability, Magic Bounce

 5: Essential
	  The sort of ability that defines metagames.
	ex. Imposter, Shadow Tag

*/

export const Abilities = {
	noability: {
		isNonstandard: "Past",
		name: "No Ability",
		rating: 0.1,
		num: 0
	},
	"てきおうりょく": {
		onModifyMove(move) {
			move.stab = 2
		},
		name: "てきおうりょく",
		rating: 4,
		num: 91
	},
	"スカイスキン": {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				"さばきのつぶて",
				"multiattack",
				"naturalgift",
				"めざめるダンス",
				"technoblast",
				"だいちのはどう",
				"ウェザーボール"
			]
			if (
				move.type === "Normal" &&
				!noModifyType.includes(move.id) &&
				!(move.isZ && move.category !== "Status") &&
				!(move.name === "テラバースト" && pokemon.terastallized)
			) {
				move.type = "Flying"
				move.typeChangerBoosted = this.effect
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect)
				return this.chainModify([4915, 4096])
		},
		name: "スカイスキン",
		rating: 4,
		num: 184
	},
	"ゆうばく": {
		name: "ゆうばく",
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (
				!target.hp &&
				this.checkMoveMakesContact(move, source, target, true)
			) {
				this.damage(source.baseMaxhp / 4, source, target)
			}
		},
		rating: 2,
		num: 106
	},
	"エアロック": {
		onSwitchIn(pokemon) {
			this.effectState.switchingIn = true
		},
		onStart(pokemon) {
			// Air Lock does not activate when Skill Swapped or when Neutralizing Gas leaves the field
			if (this.effectState.switchingIn) {
				this.add("-ability", pokemon, "エアロック")
				this.effectState.switchingIn = false
			}
			this.eachEvent("WeatherChange", this.effect)
		},
		onEnd(pokemon) {
			this.eachEvent("WeatherChange", this.effect)
		},
		suppressWeather: true,
		name: "エアロック",
		rating: 1.5,
		num: 76
	},
	"アナライズ": {
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon) {
			let boosted = true
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue
				if (this.queue.willMove(target)) {
					boosted = false
					break
				}
			}
			if (boosted) {
				this.debug("Analytic boost")
				return this.chainModify([5325, 4096])
			}
		},
		name: "アナライズ",
		rating: 2.5,
		num: 148
	},
	"いかりのつぼ": {
		onHit(target, source, move) {
			if (!target.hp) return
			if (move?.effectType === "Move" && target.getMoveHitData(move).crit) {
				this.boost({ atk: 12 }, target, target)
			}
		},
		name: "いかりのつぼ",
		rating: 1,
		num: 83
	},
	"いかりのこうら": {
		onDamage(damage, target, source, effect) {
			if (
				effect.effectType === "Move" &&
				!effect.multihit &&
				!effect.negateSecondary &&
				!(effect.hasSheerForce && source.hasAbility("ちからずく"))
			) {
				this.effectState.checkedAngerShell = false
			} else {
				this.effectState.checkedAngerShell = true
			}
		},
		onTryEatItem(item) {
			const healingItems = [
				"バンジのみ",
				"ナゾのみ",
				"フィラのみ",
				"イアのみ",
				"マゴのみ",
				"オボンのみ",
				"ウイのみ",
				"オレンのみ",
				"berryjuice"
			]
			if (healingItems.includes(item.id)) {
				return this.effectState.checkedAngerShell
			}
			return true
		},
		onAfterMoveSecondary(target, source, move) {
			this.effectState.checkedAngerShell = true
			if (!source || source === target || !target.hp || !move.totalDamage)
				return
			const lastAttackedBy = target.getLastAttackedBy()
			if (!lastAttackedBy) return
			const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage
			if (
				target.hp <= target.maxhp / 2 &&
				target.hp + damage > target.maxhp / 2
			) {
				this.boost({ atk: 1, spa: 1, spe: 1, def: -1, spd: -1 }, target, target)
			}
		},
		name: "いかりのこうら",
		rating: 3,
		num: 271
	},
	"きけんよち": {
		onStart(pokemon) {
			for (const target of pokemon.foes()) {
				for (const moveSlot of target.moveSlots) {
					const move = this.dex.moves.get(moveSlot.move)
					if (move.category === "Status") continue
					const moveType = move.id === "hiddenpower" ? target.hpType : move.type
					if (
						(this.dex.getImmunity(moveType, pokemon) &&
							this.dex.getEffectiveness(moveType, pokemon) > 0) ||
						move.ohko
					) {
						this.add("-ability", pokemon, "きけんよち")
						return
					}
				}
			}
		},
		name: "きけんよち",
		rating: 0.5,
		num: 107
	},
	"ありじごく": {
		onFoeTrapPokemon(pokemon) {
			if (!pokemon.isAdjacent(this.effectState.target)) return
			if (pokemon.isGrounded()) {
				pokemon.tryTrap(true)
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectState.target
			if (!source || !pokemon.isAdjacent(source)) return
			if (pokemon.isGrounded(!pokemon.knownType)) {
				// Negate immunity if the type is unknown
				pokemon.maybeTrapped = true
			}
		},
		name: "ありじごく",
		rating: 5,
		num: 71
	},
	"テイルアーマー": {
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ["ほろびのうた", "flowershield", "rototiller"]
			if (
				move.target === "foeSide" ||
				(move.target === "all" && !targetAllExceptions.includes(move.id))
			) {
				return
			}

			const armorTailHolder = this.effectState.target
			if (
				(source.isAlly(armorTailHolder) || move.target === "all") &&
				move.priority > 0.1
			) {
				this.attrLastMove("[still]")
				this.add(
					"cant",
					armorTailHolder,
					"ability: Armor Tail",
					move,
					"[of] " + target
				)
				return false
			}
		},
		isBreakable: true,
		name: "テイルアーマー",
		rating: 2.5,
		num: 296
	},
	"アロマベール": {
		onAllyTryAddVolatile(status, target, source, effect) {
			if (
				[
					"メロメロ",
					"かなしばり",
					"アンコール",
					"healblock",
					"ちょうはつ",
					"いちゃもん"
				].includes(status.id)
			) {
				if (effect.effectType === "Move") {
					const effectHolder = this.effectState.target
					this.add(
						"-block",
						target,
						"ability: Aroma Veil",
						"[of] " + effectHolder
					)
				}
				return null
			}
		},
		isBreakable: true,
		name: "アロマベール",
		rating: 2,
		num: 165
	},
	asoneglastrier: {
		onPreStart(pokemon) {
			this.add("-ability", pokemon, "じんばいったい")
			this.add("-ability", pokemon, "きんちょうかん")
			this.effectState.unnerved = true
		},
		onEnd() {
			this.effectState.unnerved = false
		},
		onFoeTryEatItem() {
			return !this.effectState.unnerved
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				this.boost(
					{ atk: length },
					source,
					source,
					this.dex.abilities.get("しろのいななき")
				)
			}
		},
		isPermanent: true,
		name: "As One (Glastrier)",
		rating: 3.5,
		num: 266
	},
	asonespectrier: {
		onPreStart(pokemon) {
			this.add("-ability", pokemon, "じんばいったい")
			this.add("-ability", pokemon, "きんちょうかん")
			this.effectState.unnerved = true
		},
		onEnd() {
			this.effectState.unnerved = false
		},
		onFoeTryEatItem() {
			return !this.effectState.unnerved
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				this.boost(
					{ spa: length },
					source,
					source,
					this.dex.abilities.get("くろのいななき")
				)
			}
		},
		isPermanent: true,
		name: "As One (Spectrier)",
		rating: 3.5,
		num: 267
	},
	"オーラブレイク": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "オーラブレイク")
		},
		onAnyTryPrimaryHit(target, source, move) {
			if (target === source || move.category === "Status") return
			move.hasAuraBreak = true
		},
		isBreakable: true,
		name: "オーラブレイク",
		rating: 1,
		num: 188
	},
	"ナイトメア": {
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (!pokemon.hp) return
			for (const target of pokemon.foes()) {
				if (target.status === "slp" || target.hasAbility("ぜったいねむり")) {
					this.damage(target.baseMaxhp / 8, target, pokemon)
				}
			}
		},
		name: "ナイトメア",
		rating: 1.5,
		num: 123
	},
	"たまひろい": {
		name: "たまひろい",
		rating: 0,
		num: 237
	},
	"バッテリー": {
		onAllyBasePowerPriority: 22,
		onAllyBasePower(basePower, attacker, defender, move) {
			if (attacker !== this.effectState.target && move.category === "Special") {
				this.debug("Battery boost")
				return this.chainModify([5325, 4096])
			}
		},
		name: "バッテリー",
		rating: 0,
		num: 217
	},
	"カブトアーマー": {
		onCriticalHit: false,
		isBreakable: true,
		name: "カブトアーマー",
		rating: 1,
		num: 4
	},
	"きずなへんげ": {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect?.effectType !== "Move") return
			if (source.abilityState.battleBondTriggered) return
			if (
				source.species.id === "greninjabond" &&
				source.hp &&
				!source.transformed &&
				source.side.foePokemonLeft()
			) {
				this.boost({ atk: 1, spa: 1, spe: 1 }, source, source, this.effect)
				this.add("-activate", source, "ability: Battle Bond")
				source.abilityState.battleBondTriggered = true
			}
		},
		isPermanent: true,
		name: "きずなへんげ",
		rating: 3.5,
		num: 210
	},
	"わざわいのたま": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "わざわいのたま")
		},
		onAnyModifySpD(spd, target, source, move) {
			const abilityHolder = this.effectState.target
			if (target.hasAbility("わざわいのたま")) return
			if (!move.ruinedSpD?.hasAbility("わざわいのたま"))
				move.ruinedSpD = abilityHolder
			if (move.ruinedSpD !== abilityHolder) return
			this.debug("Beads of Ruin SpD drop")
			return this.chainModify(0.75)
		},
		name: "わざわいのたま",
		rating: 4.5,
		num: 284
	},
	"ビーストブースト": {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				const bestStat = source.getBestStat(true, true)
				this.boost({ [bestStat]: length }, source)
			}
		},
		name: "ビーストブースト",
		rating: 3.5,
		num: 224
	},
	"ぎゃくじょう": {
		onDamage(damage, target, source, effect) {
			if (
				effect.effectType === "Move" &&
				!effect.multihit &&
				!effect.negateSecondary &&
				!(effect.hasSheerForce && source.hasAbility("ちからずく"))
			) {
				this.effectState.checkedBerserk = false
			} else {
				this.effectState.checkedBerserk = true
			}
		},
		onTryEatItem(item) {
			const healingItems = [
				"バンジのみ",
				"ナゾのみ",
				"フィラのみ",
				"イアのみ",
				"マゴのみ",
				"オボンのみ",
				"ウイのみ",
				"オレンのみ",
				"berryjuice"
			]
			if (healingItems.includes(item.id)) {
				return this.effectState.checkedBerserk
			}
			return true
		},
		onAfterMoveSecondary(target, source, move) {
			this.effectState.checkedBerserk = true
			if (!source || source === target || !target.hp || !move.totalDamage)
				return
			const lastAttackedBy = target.getLastAttackedBy()
			if (!lastAttackedBy) return
			const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage
			if (
				target.hp <= target.maxhp / 2 &&
				target.hp + damage > target.maxhp / 2
			) {
				this.boost({ spa: 1 }, target, target)
			}
		},
		name: "ぎゃくじょう",
		rating: 2,
		num: 201
	},
	"はとむね": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			if (boost.def && boost.def < 0) {
				delete boost.def
				if (!effect.secondaries && effect.id !== "octolock") {
					this.add(
						"-fail",
						target,
						"unboost",
						"Defense",
						"[from] ability: Big Pecks",
						"[of] " + target
					)
				}
			}
		},
		isBreakable: true,
		name: "はとむね",
		rating: 0.5,
		num: 145
	},
	"もうか": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Fire" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Blaze boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Fire" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Blaze boost")
				return this.chainModify(1.5)
			}
		},
		name: "もうか",
		rating: 2,
		num: 66
	},
	"ぼうだん": {
		onTryHit(pokemon, target, move) {
			if (move.flags["bullet"]) {
				this.add("-immune", pokemon, "[from] ability: Bulletproof")
				return null
			}
		},
		isBreakable: true,
		name: "ぼうだん",
		rating: 3,
		num: 171
	},
	"ほおぶくろ": {
		onEatItem(item, pokemon) {
			this.heal(pokemon.baseMaxhp / 3)
		},
		name: "ほおぶくろ",
		rating: 2,
		num: 167
	},
	"しろのいななき": {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				this.boost({ atk: length }, source)
			}
		},
		name: "しろのいななき",
		rating: 3,
		num: 264
	},
	"ようりょくそ": {
		onModifySpe(spe, pokemon) {
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2)
			}
		},
		name: "ようりょくそ",
		rating: 3,
		num: 34
	},
	"クリアボディ": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			let showMsg = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					delete boost[i]
					showMsg = true
				}
			}
			if (showMsg && !effect.secondaries && effect.id !== "octolock") {
				this.add(
					"-fail",
					target,
					"unboost",
					"[from] ability: Clear Body",
					"[of] " + target
				)
			}
		},
		isBreakable: true,
		name: "クリアボディ",
		rating: 2,
		num: 29
	},
	"ノーてんき": {
		onSwitchIn(pokemon) {
			this.effectState.switchingIn = true
		},
		onStart(pokemon) {
			// Cloud Nine does not activate when Skill Swapped or when Neutralizing Gas leaves the field
			if (this.effectState.switchingIn) {
				this.add("-ability", pokemon, "ノーてんき")
				this.effectState.switchingIn = false
			}
			this.eachEvent("WeatherChange", this.effect)
		},
		onEnd(pokemon) {
			this.eachEvent("WeatherChange", this.effect)
		},
		suppressWeather: true,
		name: "ノーてんき",
		rating: 1.5,
		num: 13
	},
	"へんしょく": {
		onAfterMoveSecondary(target, source, move) {
			if (!target.hp) return
			const type = move.type
			if (
				target.isActive &&
				move.effectType === "Move" &&
				move.category !== "Status" &&
				type !== "???" &&
				!target.hasType(type)
			) {
				if (!target.setType(type)) return false
				this.add(
					"-start",
					target,
					"typechange",
					type,
					"[from] ability: Color Change"
				)

				if (target.side.active.length === 2 && target.position === 1) {
					// Curse Glitch
					const action = this.queue.willMove(target)
					if (action && action.move.id === "のろい") {
						action.targetLoc = -1
					}
				}
			}
		},
		name: "へんしょく",
		rating: 0,
		num: 16
	},
	"ぜったいねむり": {
		onStart(pokemon) {
			this.add("-ability", pokemon, "ぜったいねむり")
		},
		onSetStatus(status, target, source, effect) {
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Comatose")
			}
			return false
		},
		// Permanent sleep "status" implemented in the relevant sleep-checking effects
		isPermanent: true,
		name: "ぜったいねむり",
		rating: 4,
		num: 213
	},
	"しれいとう": {
		onUpdate(pokemon) {
			if (this.gameType !== "doubles") return
			const ally = pokemon.allies()[0]
			if (
				!ally ||
				pokemon.transformed ||
				pokemon.baseSpecies.baseSpecies !== "Tatsugiri" ||
				ally.baseSpecies.baseSpecies !== "Dondozo"
			) {
				// Handle any edge cases
				if (pokemon.getVolatile("commanding"))
					pokemon.removeVolatile("commanding")
				return
			}

			if (!pokemon.getVolatile("commanding")) {
				// If Dondozo already was commanded this fails
				if (ally.getVolatile("commanded")) return
				// Cancel all actions this turn for pokemon if applicable
				this.queue.cancelAction(pokemon)
				// Add volatiles to both pokemon
				this.add("-activate", pokemon, "ability: Commander", "[of] " + ally)
				pokemon.addVolatile("commanding")
				ally.addVolatile("commanded", pokemon)
				// Continued in conditions.ts in the volatiles
			} else {
				if (!ally.fainted) return
				pokemon.removeVolatile("commanding")
			}
		},
		name: "しれいとう",
		rating: 0,
		num: 279
	},
	"かちき": {
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.isAlly(source)) {
				if (effect.id === "ねばねばネット") {
					this.hint(
						"Court Change Sticky Web counts as lowering your own Speed, and Competitive only affects stats lowered by foes.",
						true,
						source.side
					)
				}
				return
			}
			let statsLowered = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					statsLowered = true
				}
			}
			if (statsLowered) {
				this.boost({ spa: 2 }, target, target, null, false, true)
			}
		},
		name: "かちき",
		rating: 2.5,
		num: 172
	},
	"ふくがん": {
		onSourceModifyAccuracyPriority: -1,
		onSourceModifyAccuracy(accuracy) {
			if (typeof accuracy !== "number") return
			this.debug("compoundeyes - enhancing accuracy")
			return this.chainModify([5325, 4096])
		},
		name: "ふくがん",
		rating: 3,
		num: 14
	},
	"あまのじゃく": {
		onChangeBoost(boost, target, source, effect) {
			if (effect && effect.id === "zpower") return
			let i
			for (i in boost) {
				boost[i] *= -1
			}
		},
		isBreakable: true,
		name: "あまのじゃく",
		rating: 4.5,
		num: 126
	},
	"ふしょく": {
		// Implemented in sim/pokemon.js:Pokemon#setStatus
		name: "ふしょく",
		rating: 2.5,
		num: 212
	},
	"きょうえん": {
		onStart(pokemon) {
			const ally = pokemon.allies()[0]
			if (!ally) return

			let i
			for (i in ally.boosts) {
				pokemon.boosts[i] = ally.boosts[i]
			}
			const volatilesToCopy = ["きあいだめ", "gmaxchistrike", "laserfocus"]
			for (const volatile of volatilesToCopy) {
				if (ally.volatiles[volatile]) {
					pokemon.addVolatile(volatile)
					if (volatile === "gmaxchistrike")
						pokemon.volatiles[volatile].layers = ally.volatiles[volatile].layers
				} else {
					pokemon.removeVolatile(volatile)
				}
			}
			this.add("-copyboost", pokemon, ally, "[from] ability: Costar")
		},
		name: "きょうえん",
		rating: 0,
		num: 294
	},
	"わたげ": {
		onDamagingHit(damage, target, source, move) {
			let activated = false
			for (const pokemon of this.getAllActive()) {
				if (pokemon === target || pokemon.fainted) continue
				if (!activated) {
					this.add("-ability", target, "わたげ")
					activated = true
				}
				this.boost({ spe: -1 }, pokemon, target, null, true)
			}
		},
		name: "わたげ",
		rating: 2,
		num: 238
	},
	"はんすう": {
		onEatItem(item, pokemon) {
			if (item.isBerry && pokemon.addVolatile("はんすう")) {
				pokemon.volatiles["はんすう"].berry = item
			}
		},
		onEnd(pokemon) {
			delete pokemon.volatiles["はんすう"]
		},
		condition: {
			noCopy: true,
			duration: 2,
			onRestart() {
				this.effectState.duration = 2
			},
			onResidualOrder: 28,
			onResidualSubOrder: 2,
			onEnd(pokemon) {
				if (pokemon.hp) {
					const item = this.effectState.berry
					this.add("-activate", pokemon, "ability: Cud Chew")
					this.add("-enditem", pokemon, item.name, "[eat]")
					if (this.singleEvent("Eat", item, null, pokemon, null, null)) {
						this.runEvent("EatItem", pokemon, null, null, item)
					}
					if (item.onEat) pokemon.ateBerry = true
				}
			}
		},
		name: "はんすう",
		rating: 2,
		num: 291
	},
	"きみょうなくすり": {
		onStart(pokemon) {
			for (const ally of pokemon.adjacentAllies()) {
				ally.clearBoosts()
				this.add(
					"-clearboost",
					ally,
					"[from] ability: Curious Medicine",
					"[of] " + pokemon
				)
			}
		},
		name: "きみょうなくすり",
		rating: 0,
		num: 261
	},
	"のろわれボディ": {
		onDamagingHit(damage, target, source, move) {
			if (source.volatiles["かなしばり"]) return
			if (!move.isMax && !move.flags["futuremove"] && move.id !== "わるあがき") {
				if (this.randomChance(3, 10)) {
					source.addVolatile("かなしばり", this.effectState.target)
				}
			}
		},
		name: "のろわれボディ",
		rating: 2,
		num: 130
	},
	"メロメロボディ": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(3, 10)) {
					source.addVolatile("メロメロ", this.effectState.target)
				}
			}
		},
		name: "メロメロボディ",
		rating: 0.5,
		num: 56
	},
	"しめりけ": {
		onAnyTryMove(target, source, effect) {
			if (
				["だいばくはつ", "mindblown", "ミストバースト", "じばく"].includes(
					effect.id
				)
			) {
				this.attrLastMove("[still]")
				this.add(
					"cant",
					this.effectState.target,
					"ability: Damp",
					effect,
					"[of] " + target
				)
				return false
			}
		},
		onAnyDamage(damage, target, source, effect) {
			if (effect && effect.name === "ゆうばく") {
				return false
			}
		},
		isBreakable: true,
		name: "しめりけ",
		rating: 0.5,
		num: 6
	},
	"おどりこ": {
		name: "おどりこ",
		// implemented in runMove in scripts.js
		rating: 1.5,
		num: 216
	},
	"ダークオーラ": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "ダークオーラ")
		},
		onAnyBasePowerPriority: 20,
		onAnyBasePower(basePower, source, target, move) {
			if (
				target === source ||
				move.category === "Status" ||
				move.type !== "Dark"
			)
				return
			if (!move.auraBooster?.hasAbility("ダークオーラ"))
				move.auraBooster = this.effectState.target
			if (move.auraBooster !== this.effectState.target) return
			return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096])
		},
		name: "ダークオーラ",
		rating: 3,
		num: 186
	},
	"ふくつのたて": {
		onStart(pokemon) {
			if (pokemon.shieldBoost) return
			pokemon.shieldBoost = true
			this.boost({ def: 1 }, pokemon)
		},
		name: "ふくつのたて",
		rating: 3.5,
		num: 235
	},
	"ビビッドボディ": {
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ["ほろびのうた", "flowershield", "rototiller"]
			if (
				move.target === "foeSide" ||
				(move.target === "all" && !targetAllExceptions.includes(move.id))
			) {
				return
			}

			const dazzlingHolder = this.effectState.target
			if (
				(source.isAlly(dazzlingHolder) || move.target === "all") &&
				move.priority > 0.1
			) {
				this.attrLastMove("[still]")
				this.add(
					"cant",
					dazzlingHolder,
					"ability: Dazzling",
					move,
					"[of] " + target
				)
				return false
			}
		},
		isBreakable: true,
		name: "ビビッドボディ",
		rating: 2.5,
		num: 219
	},
	"よわき": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				return this.chainModify(0.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				return this.chainModify(0.5)
			}
		},
		name: "よわき",
		rating: -1,
		num: 129
	},
	"まけんき": {
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.isAlly(source)) {
				if (effect.id === "ねばねばネット") {
					this.hint(
						"Court Change Sticky Web counts as lowering your own Speed, and Defiant only affects stats lowered by foes.",
						true,
						source.side
					)
				}
				return
			}
			let statsLowered = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					statsLowered = true
				}
			}
			if (statsLowered) {
				this.boost({ atk: 2 }, target, target, null, false, true)
			}
		},
		name: "まけんき",
		rating: 3,
		num: 128
	},
	"デルタストリーム": {
		onStart(source) {
			this.field.setWeather("デルタストリーム")
		},
		onAnySetWeather(target, source, weather) {
			const strongWeathers = ["おわりのだいち", "はじまりのうみ", "デルタストリーム"]
			if (
				this.field.getWeather().id === "デルタストリーム" &&
				!strongWeathers.includes(weather.id)
			)
				return false
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue
				if (target.hasAbility("デルタストリーム")) {
					this.field.weatherState.source = target
					return
				}
			}
			this.field.clearWeather()
		},
		name: "デルタストリーム",
		rating: 4,
		num: 191
	},
	"おわりのだいち": {
		onStart(source) {
			this.field.setWeather("おわりのだいち")
		},
		onAnySetWeather(target, source, weather) {
			const strongWeathers = ["おわりのだいち", "はじまりのうみ", "デルタストリーム"]
			if (
				this.field.getWeather().id === "おわりのだいち" &&
				!strongWeathers.includes(weather.id)
			)
				return false
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue
				if (target.hasAbility("おわりのだいち")) {
					this.field.weatherState.source = target
					return
				}
			}
			this.field.clearWeather()
		},
		name: "おわりのだいち",
		rating: 4.5,
		num: 190
	},
	"ばけのかわ": {
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (
				effect &&
				effect.effectType === "Move" &&
				["mimikyu", "mimikyutotem"].includes(target.species.id) &&
				!target.transformed
			) {
				this.add("-activate", target, "ability: Disguise")
				this.effectState.busted = true
				return 0
			}
		},
		onCriticalHit(target, source, move) {
			if (!target) return
			if (
				!["mimikyu", "mimikyutotem"].includes(target.species.id) ||
				target.transformed
			) {
				return
			}
			const hitSub =
				target.volatiles["みがわり"] &&
				!move.flags["bypasssub"] &&
				!(move.infiltrates && this.gen >= 6)
			if (hitSub) return

			if (!target.runImmunity(move.type)) return
			return false
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target || move.category === "Status") return
			if (
				!["mimikyu", "mimikyutotem"].includes(target.species.id) ||
				target.transformed
			) {
				return
			}

			const hitSub =
				target.volatiles["みがわり"] &&
				!move.flags["bypasssub"] &&
				!(move.infiltrates && this.gen >= 6)
			if (hitSub) return

			if (!target.runImmunity(move.type)) return
			return 0
		},
		onUpdate(pokemon) {
			if (
				["mimikyu", "mimikyutotem"].includes(pokemon.species.id) &&
				this.effectState.busted
			) {
				const speciesid =
					pokemon.species.id === "mimikyutotem"
						? "Mimikyu-Busted-Totem"
						: "Mimikyu-Busted"
				pokemon.formeChange(speciesid, this.effect, true)
				this.damage(
					pokemon.baseMaxhp / 8,
					pokemon,
					pokemon,
					this.dex.species.get(speciesid)
				)
			}
		},
		isBreakable: true,
		isPermanent: true,
		name: "ばけのかわ",
		rating: 3.5,
		num: 209
	},
	"ダウンロード": {
		onStart(pokemon) {
			let totaldef = 0
			let totalspd = 0
			for (const target of pokemon.foes()) {
				totaldef += target.getStat("def", false, true)
				totalspd += target.getStat("spd", false, true)
			}
			if (totaldef && totaldef >= totalspd) {
				this.boost({ spa: 1 })
			} else if (totalspd) {
				this.boost({ atk: 1 })
			}
		},
		name: "ダウンロード",
		rating: 3.5,
		num: 88
	},
	"りゅうのあぎと": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Dragon") {
				this.debug("Dragon's Maw boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Dragon") {
				this.debug("Dragon's Maw boost")
				return this.chainModify(1.5)
			}
		},
		name: "りゅうのあぎと",
		rating: 3.5,
		num: 263
	},
	"あめふらし": {
		onStart(source) {
			for (const action of this.queue) {
				if (
					action.choice === "runPrimal" &&
					action.pokemon === source &&
					source.species.id === "kyogre"
				)
					return
				if (action.choice !== "runSwitch" && action.choice !== "runPrimal")
					break
			}
			this.field.setWeather("あまごい")
		},
		name: "あめふらし",
		rating: 4,
		num: 2
	},
	"ひでり": {
		onStart(source) {
			for (const action of this.queue) {
				if (
					action.choice === "runPrimal" &&
					action.pokemon === source &&
					source.species.id === "groudon"
				)
					return
				if (action.choice !== "runSwitch" && action.choice !== "runPrimal")
					break
			}
			this.field.setWeather("にほんばれ")
		},
		name: "ひでり",
		rating: 4,
		num: 70
	},
	"かんそうはだ": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Water") {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add("-immune", target, "[from] ability: Dry Skin")
				}
				return null
			}
		},
		onSourceBasePowerPriority: 17,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === "Fire") {
				return this.chainModify(1.25)
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem("ばんのうがさ")) return
			if (effect.id === "あまごい" || effect.id === "はじまりのうみ") {
				this.heal(target.baseMaxhp / 8)
			} else if (effect.id === "にほんばれ" || effect.id === "おわりのだいち") {
				this.damage(target.baseMaxhp / 8, target, target)
			}
		},
		isBreakable: true,
		name: "かんそうはだ",
		rating: 3,
		num: 87
	},
	"はやおき": {
		name: "はやおき",
		// Implemented in statuses.js
		rating: 1.5,
		num: 48
	},
	"どしょく": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "じめん") {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add("-immune", target, "[from] ability: Earth Eater")
				}
				return null
			}
		},
		isBreakable: true,
		name: "どしょく",
		rating: 3.5,
		num: 297
	},
	"ほうし": {
		onDamagingHit(damage, target, source, move) {
			if (
				this.checkMoveMakesContact(move, source, target) &&
				!source.status &&
				source.runStatusImmunity("powder")
			) {
				const r = this.random(100)
				if (r < 11) {
					source.setStatus("slp", target)
				} else if (r < 21) {
					source.setStatus("par", target)
				} else if (r < 30) {
					source.setStatus("psn", target)
				}
			}
		},
		name: "ほうし",
		rating: 2,
		num: 27
	},
	"エレキメイカー": {
		onStart(source) {
			this.field.setTerrain("エレキフィールド")
		},
		name: "エレキメイカー",
		rating: 4,
		num: 226
	},
	"でんきにかえる": {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			target.addVolatile("じゅうでん")
		},
		name: "でんきにかえる",
		rating: 3,
		num: 280
	},
	embodyaspectcornerstone: {
		onStart(pokemon) {
			if (
				pokemon.baseSpecies.name === "Ogerpon-Cornerstone-Tera" &&
				!pokemon.transformed &&
				!this.effectState.embodied
			) {
				this.effectState.embodied = true
				this.boost({ def: 1 }, pokemon)
			}
		},
		onSwitchIn() {
			delete this.effectState.embodied
		},
		name: "Embody Aspect (Cornerstone)",
		rating: 3.5,
		num: 304
	},
	embodyaspecthearthflame: {
		onStart(pokemon) {
			if (
				pokemon.baseSpecies.name === "Ogerpon-Hearthflame-Tera" &&
				!pokemon.transformed &&
				!this.effectState.embodied
			) {
				this.effectState.embodied = true
				this.boost({ atk: 1 }, pokemon)
			}
		},
		onSwitchIn() {
			delete this.effectState.embodied
		},
		name: "Embody Aspect (Hearthflame)",
		rating: 3.5,
		num: 303
	},
	embodyaspectteal: {
		onStart(pokemon) {
			if (
				pokemon.baseSpecies.name === "Ogerpon-Teal-Tera" &&
				!pokemon.transformed &&
				!this.effectState.embodied
			) {
				this.effectState.embodied = true
				this.boost({ spe: 1 }, pokemon)
			}
		},
		onSwitchIn() {
			delete this.effectState.embodied
		},
		name: "Embody Aspect (Teal)",
		rating: 3.5,
		num: 301
	},
	embodyaspectwellspring: {
		onStart(pokemon) {
			if (
				pokemon.baseSpecies.name === "Ogerpon-Wellspring-Tera" &&
				!pokemon.transformed &&
				!this.effectState.embodied
			) {
				this.effectState.embodied = true
				this.boost({ spd: 1 }, pokemon)
			}
		},
		onSwitchIn() {
			delete this.effectState.embodied
		},
		name: "Embody Aspect (Wellspring)",
		rating: 3.5,
		num: 302
	},
	"ききかいひ": {
		onEmergencyExit(target) {
			if (
				!this.canSwitch(target.side) ||
				target.forceSwitchFlag ||
				target.switchFlag
			)
				return
			for (const side of this.sides) {
				for (const active of side.active) {
					active.switchFlag = false
				}
			}
			target.switchFlag = true
			this.add("-activate", target, "ability: Emergency Exit")
		},
		name: "ききかいひ",
		rating: 1,
		num: 194
	},
	"フェアリーオーラ": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "フェアリーオーラ")
		},
		onAnyBasePowerPriority: 20,
		onAnyBasePower(basePower, source, target, move) {
			if (
				target === source ||
				move.category === "Status" ||
				move.type !== "Fairy"
			)
				return
			if (!move.auraBooster?.hasAbility("フェアリーオーラ"))
				move.auraBooster = this.effectState.target
			if (move.auraBooster !== this.effectState.target) return
			return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096])
		},
		name: "フェアリーオーラ",
		rating: 3,
		num: 187
	},
	"フィルター": {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				this.debug("Filter neutralize")
				return this.chainModify(0.75)
			}
		},
		isBreakable: true,
		name: "フィルター",
		rating: 3,
		num: 111
	},
	"ほのおのからだ": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus("brn", target)
				}
			}
		},
		name: "ほのおのからだ",
		rating: 2,
		num: 49
	},
	"ねつぼうそう": {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.status === "brn" && move.category === "Special") {
				return this.chainModify(1.5)
			}
		},
		name: "ねつぼうそう",
		rating: 2,
		num: 138
	},
	"もらいび": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Fire") {
				move.accuracy = true
				if (!target.addVolatile("もらいび")) {
					this.add("-immune", target, "[from] ability: Flash Fire")
				}
				return null
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile("もらいび")
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add("-start", target, "ability: Flash Fire")
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === "Fire" && attacker.hasAbility("もらいび")) {
					this.debug("Flash Fire boost")
					return this.chainModify(1.5)
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === "Fire" && attacker.hasAbility("もらいび")) {
					this.debug("Flash Fire boost")
					return this.chainModify(1.5)
				}
			},
			onEnd(target) {
				this.add("-end", target, "ability: Flash Fire", "[silent]")
			}
		},
		isBreakable: true,
		name: "もらいび",
		rating: 3.5,
		num: 18
	},
	"フラワーギフト": {
		onStart(pokemon) {
			this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon)
		},
		onWeatherChange(pokemon) {
			if (
				!pokemon.isActive ||
				pokemon.baseSpecies.baseSpecies !== "Cherrim" ||
				pokemon.transformed
			)
				return
			if (!pokemon.hp) return
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				if (pokemon.species.id !== "cherrimsunshine") {
					pokemon.formeChange("Cherrim-Sunshine", this.effect, false, "[msg]")
				}
			} else {
				if (pokemon.species.id === "cherrimsunshine") {
					pokemon.formeChange("Cherrim", this.effect, false, "[msg]")
				}
			}
		},
		onAllyModifyAtkPriority: 3,
		onAllyModifyAtk(atk, pokemon) {
			if (this.effectState.target.baseSpecies.baseSpecies !== "Cherrim") return
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5)
			}
		},
		onAllyModifySpDPriority: 4,
		onAllyModifySpD(spd, pokemon) {
			if (this.effectState.target.baseSpecies.baseSpecies !== "Cherrim") return
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5)
			}
		},
		isBreakable: true,
		name: "フラワーギフト",
		rating: 1,
		num: 122
	},
	"フラワーベール": {
		onAllyTryBoost(boost, target, source, effect) {
			if ((source && target === source) || !target.hasType("Grass")) return
			let showMsg = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					delete boost[i]
					showMsg = true
				}
			}
			if (showMsg && !effect.secondaries) {
				const effectHolder = this.effectState.target
				this.add(
					"-block",
					target,
					"ability: Flower Veil",
					"[of] " + effectHolder
				)
			}
		},
		onAllySetStatus(status, target, source, effect) {
			if (
				target.hasType("Grass") &&
				source &&
				target !== source &&
				effect &&
				effect.id !== "あくび"
			) {
				this.debug("interrupting setStatus with Flower Veil")
				if (
					effect.name === "シンクロ" ||
					(effect.effectType === "Move" && !effect.secondaries)
				) {
					const effectHolder = this.effectState.target
					this.add(
						"-block",
						target,
						"ability: Flower Veil",
						"[of] " + effectHolder
					)
				}
				return null
			}
		},
		onAllyTryAddVolatile(status, target) {
			if (target.hasType("Grass") && status.id === "あくび") {
				this.debug("Flower Veil blocking yawn")
				const effectHolder = this.effectState.target
				this.add(
					"-block",
					target,
					"ability: Flower Veil",
					"[of] " + effectHolder
				)
				return null
			}
		},
		isBreakable: true,
		name: "フラワーベール",
		rating: 0,
		num: 166
	},
	"もふもふ": {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1
			if (move.type === "Fire") mod *= 2
			if (move.flags["contact"]) mod /= 2
			return this.chainModify(mod)
		},
		isBreakable: true,
		name: "もふもふ",
		rating: 3.5,
		num: 218
	},
	"てんきや": {
		onStart(pokemon) {
			this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon)
		},
		onWeatherChange(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== "Castform" || pokemon.transformed)
				return
			let forme = null
			switch (pokemon.effectiveWeather()) {
				case "にほんばれ":
				case "おわりのだいち":
					if (pokemon.species.id !== "castformsunny") forme = "Castform-Sunny"
					break
				case "あまごい":
				case "はじまりのうみ":
					if (pokemon.species.id !== "castformrainy") forme = "Castform-Rainy"
					break
				case "hail":
				case "snow":
					if (pokemon.species.id !== "castformsnowy") forme = "Castform-Snowy"
					break
				default:
					if (pokemon.species.id !== "castform") forme = "Castform"
					break
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, "[msg]")
			}
		},
		name: "てんきや",
		rating: 2,
		num: 59
	},
	"よちむ": {
		onStart(pokemon) {
			let warnMoves = []
			let warnBp = 1
			for (const target of pokemon.foes()) {
				for (const moveSlot of target.moveSlots) {
					const move = this.dex.moves.get(moveSlot.move)
					let bp = move.basePower
					if (move.ohko) bp = 150
					if (
						move.id === "カウンター" ||
						move.id === "メタルバースト" ||
						move.id === "ミラーコート"
					)
						bp = 120
					if (bp === 1) bp = 80
					if (!bp && move.category !== "Status") bp = 80
					if (bp > warnBp) {
						warnMoves = [[move, target]]
						warnBp = bp
					} else if (bp === warnBp) {
						warnMoves.push([move, target])
					}
				}
			}
			if (!warnMoves.length) return
			const [warnMoveName, warnTarget] = this.sample(warnMoves)
			this.add(
				"-activate",
				pokemon,
				"ability: Forewarn",
				warnMoveName,
				"[of] " + warnTarget
			)
		},
		name: "よちむ",
		rating: 0.5,
		num: 108
	},
	"フレンドガード": {
		name: "フレンドガード",
		onAnyModifyDamage(damage, source, target, move) {
			if (
				target !== this.effectState.target &&
				target.isAlly(this.effectState.target)
			) {
				this.debug("Friend Guard weaken")
				return this.chainModify(0.75)
			}
		},
		isBreakable: true,
		rating: 0,
		num: 132
	},
	"おみとおし": {
		onStart(pokemon) {
			for (const target of pokemon.foes()) {
				if (target.item) {
					this.add(
						"-item",
						target,
						target.getItem().name,
						"[from] ability: Frisk",
						"[of] " + pokemon,
						"[identify]"
					)
				}
			}
		},
		name: "おみとおし",
		rating: 1.5,
		num: 119
	},
	"メタルプロテクト": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			let showMsg = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					delete boost[i]
					showMsg = true
				}
			}
			if (showMsg && !effect.secondaries && effect.id !== "octolock") {
				this.add(
					"-fail",
					target,
					"unboost",
					"[from] ability: Full Metal Body",
					"[of] " + target
				)
			}
		},
		name: "メタルプロテクト",
		rating: 2,
		num: 230
	},
	"ファーコート": {
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(2)
		},
		isBreakable: true,
		name: "ファーコート",
		rating: 4,
		num: 169
	},
	"はやてのつばさ": {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.type === "Flying" && pokemon.hp === pokemon.maxhp)
				return priority + 1
		},
		name: "はやてのつばさ",
		rating: 1.5,
		num: 177
	},
	"エレキスキン": {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				"さばきのつぶて",
				"multiattack",
				"naturalgift",
				"めざめるダンス",
				"technoblast",
				"だいちのはどう",
				"ウェザーボール"
			]
			if (
				move.type === "Normal" &&
				!noModifyType.includes(move.id) &&
				!(move.isZ && move.category !== "Status") &&
				!(move.name === "テラバースト" && pokemon.terastallized)
			) {
				move.type = "Electric"
				move.typeChangerBoosted = this.effect
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect)
				return this.chainModify([4915, 4096])
		},
		name: "エレキスキン",
		rating: 4,
		num: 206
	},
	"くいしんぼう": {
		name: "くいしんぼう",
		rating: 1.5,
		onStart(pokemon) {
			pokemon.abilityState.gluttony = true
		},
		onDamage(item, pokemon) {
			pokemon.abilityState.gluttony = true
		}
	},
	"おうごんのからだ": {
		onTryHit(target, source, move) {
			if (move.category === "Status" && target !== source) {
				this.add("-immune", target, "[from] ability: Good as Gold")
				return null
			}
		},
		isBreakable: true,
		name: "おうごんのからだ",
		rating: 5,
		num: 283
	},
	"ぬめぬめ": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.add("-ability", target, "ぬめぬめ")
				this.boost({ spe: -1 }, source, target, null, true)
			}
		},
		name: "ぬめぬめ",
		rating: 2,
		num: 183
	},
	"ごりむちゅう": {
		onStart(pokemon) {
			pokemon.abilityState.choiceLock = ""
		},
		onBeforeMove(pokemon, target, move) {
			if (move.isZOrMaxPowered || move.id === "わるあがき") return
			if (
				pokemon.abilityState.choiceLock &&
				pokemon.abilityState.choiceLock !== move.id
			) {
				// Fails unless ability is being ignored (these events will not run), no PP lost.
				this.addMove("move", pokemon, move.name)
				this.attrLastMove("[still]")
				this.debug("Disabled by Gorilla Tactics")
				this.add("-fail", pokemon)
				return false
			}
		},
		onModifyMove(move, pokemon) {
			if (
				pokemon.abilityState.choiceLock ||
				move.isZOrMaxPowered ||
				move.id === "わるあがき"
			)
				return
			pokemon.abilityState.choiceLock = move.id
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.volatiles["dynamax"]) return
			// PLACEHOLDER
			this.debug("Gorilla Tactics Atk Boost")
			return this.chainModify(1.5)
		},
		onDisableMove(pokemon) {
			if (!pokemon.abilityState.choiceLock) return
			if (pokemon.volatiles["dynamax"]) return
			for (const moveSlot of pokemon.moveSlots) {
				if (moveSlot.id !== pokemon.abilityState.choiceLock) {
					pokemon.disableMove(moveSlot.id, false, this.effectState.sourceEffect)
				}
			}
		},
		onEnd(pokemon) {
			pokemon.abilityState.choiceLock = ""
		},
		name: "ごりむちゅう",
		rating: 4.5,
		num: 255
	},
	"くさのけがわ": {
		onModifyDefPriority: 6,
		onModifyDef(pokemon) {
			if (this.field.isTerrain("グラスフィールド")) return this.chainModify(1.5)
		},
		isBreakable: true,
		name: "くさのけがわ",
		rating: 0.5,
		num: 179
	},
	"グラスメイカー": {
		onStart(source) {
			this.field.setTerrain("グラスフィールド")
		},
		name: "グラスメイカー",
		rating: 4,
		num: 229
	},
	"くろのいななき": {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				this.boost({ spa: length }, source)
			}
		},
		name: "くろのいななき",
		rating: 3,
		num: 265
	},
	"ばんけん": {
		onDragOutPriority: 1,
		onDragOut(pokemon) {
			this.add("-activate", pokemon, "ability: Guard Dog")
			return null
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === "いかく" && boost.atk) {
				delete boost.atk
				this.boost({ atk: 1 }, target, target, null, false, true)
			}
		},
		isBreakable: true,
		name: "ばんけん",
		rating: 2,
		num: 275
	},
	"うのミサイル": {
		onDamagingHit(damage, target, source, move) {
			if (
				!source.hp ||
				!source.isActive ||
				target.transformed ||
				target.isSemiInvulnerable()
			)
				return
			if (
				["cramorantgulping", "cramorantgorging"].includes(target.species.id)
			) {
				this.damage(source.baseMaxhp / 4, source, target)
				if (target.species.id === "cramorantgulping") {
					this.boost({ def: -1 }, source, target, null, true)
				} else {
					source.trySetStatus("par", target, move)
				}
				target.formeChange("cramorant", move)
			}
		},
		// The Dive part of this mechanic is implemented in Dive's `onTryMove` in moves.ts
		onSourceTryPrimaryHit(target, source, effect) {
			if (
				effect &&
				effect.id === "なみのり" &&
				source.hasAbility("うのミサイル") &&
				source.species.name === "Cramorant" &&
				!source.transformed
			) {
				const forme =
					source.hp <= source.maxhp / 2
						? "cramorantgorging"
						: "cramorantgulping"
				source.formeChange(forme, effect)
			}
		},
		isPermanent: true,
		name: "うのミサイル",
		rating: 2.5,
		num: 241
	},
	"こんじょう": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5)
			}
		},
		name: "こんじょう",
		rating: 3.5,
		num: 62
	},
	"ハドロンエンジン": {
		onStart(pokemon) {
			if (
				!this.field.setTerrain("エレキフィールド") &&
				this.field.isTerrain("エレキフィールド")
			) {
				this.add("-activate", pokemon, "ability: Hadron Engine")
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (this.field.isTerrain("エレキフィールド")) {
				this.debug("Hadron Engine boost")
				return this.chainModify([5461, 4096])
			}
		},
		name: "ハドロンエンジン",
		rating: 4.5,
		num: 289
	},
	"しゅうかく": {
		name: "しゅうかく",
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (
				this.field.isWeather(["にほんばれ", "おわりのだいち"]) ||
				this.randomChance(1, 2)
			) {
				if (
					pokemon.hp &&
					!pokemon.item &&
					this.dex.items.get(pokemon.lastItem).isBerry
				) {
					pokemon.setItem(pokemon.lastItem)
					pokemon.lastItem = ""
					this.add(
						"-item",
						pokemon,
						pokemon.getItem(),
						"[from] ability: Harvest"
					)
				}
			}
		},
		rating: 2.5,
		num: 139
	},
	"いやしのこころ": {
		name: "いやしのこころ",
		onResidualOrder: 5,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			for (const allyActive of pokemon.adjacentAllies()) {
				if (allyActive.status && this.randomChance(3, 10)) {
					this.add("-activate", pokemon, "ability: Healer")
					allyActive.cureStatus()
				}
			}
		},
		rating: 0,
		num: 131
	},
	"たいねつ": {
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Fire") {
				this.debug("Heatproof Atk weaken")
				return this.chainModify(0.5)
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === "Fire") {
				this.debug("Heatproof SpA weaken")
				return this.chainModify(0.5)
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect && effect.id === "brn") {
				return damage / 2
			}
		},
		isBreakable: true,
		name: "たいねつ",
		rating: 2,
		num: 85
	},
	"ヘヴィメタル": {
		onModifyWeightPriority: 1,
		onModifyWeight(weighthg) {
			return weighthg * 2
		},
		isBreakable: true,
		name: "ヘヴィメタル",
		rating: 0,
		num: 134
	},
	"みつあつめ": {
		name: "みつあつめ",
		rating: 0,
		num: 118
	},
	"おもてなし": {
		onStart(pokemon) {
			for (const ally of pokemon.adjacentAllies()) {
				this.heal(ally.baseMaxhp / 4, ally, pokemon)
			}
		},
		name: "おもてなし",
		rating: 0,
		num: 299
	},
	"ちからもち": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk) {
			return this.chainModify(2)
		},
		name: "ちからもち",
		rating: 5,
		num: 37
	},
	"はらぺこスイッチ": {
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (
				pokemon.species.baseSpecies !== "Morpeko" ||
				pokemon.transformed ||
				pokemon.terastallized
			)
				return
			const targetForme =
				pokemon.species.name === "Morpeko" ? "Morpeko-Hangry" : "Morpeko"
			pokemon.formeChange(targetForme)
		},
		name: "はらぺこスイッチ",
		rating: 1,
		num: 258
	},
	"はりきり": {
		// This should be applied directly to the stat as opposed to chaining with the others
		onModifyAtkPriority: 5,
		onModifyAtk(atk) {
			return this.modify(atk, 1.5)
		},
		onSourceModifyAccuracyPriority: -1,
		onSourceModifyAccuracy(accuracy, target, source, move) {
			if (move.category === "Physical" && typeof accuracy === "number") {
				return this.chainModify([3277, 4096])
			}
		},
		name: "はりきり",
		rating: 3.5,
		num: 55
	},
	"うるおいボディ": {
		onResidualOrder: 5,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			if (
				pokemon.status &&
				["あまごい", "はじまりのうみ"].includes(pokemon.effectiveWeather())
			) {
				this.debug("うるおいボディ")
				this.add("-activate", pokemon, "ability: Hydration")
				pokemon.cureStatus()
			}
		},
		name: "うるおいボディ",
		rating: 1.5,
		num: 93
	},
	"かいりきバサミ": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			if (boost.atk && boost.atk < 0) {
				delete boost.atk
				if (!effect.secondaries) {
					this.add(
						"-fail",
						target,
						"unboost",
						"Attack",
						"[from] ability: Hyper Cutter",
						"[of] " + target
					)
				}
			}
		},
		isBreakable: true,
		name: "かいりきバサミ",
		rating: 1.5,
		num: 52
	},
	"アイスボディ": {
		onWeather(target, source, effect) {
			if (effect.id === "hail" || effect.id === "snow") {
				this.heal(target.baseMaxhp / 16)
			}
		},
		onImmunity(type, pokemon) {
			if (type === "hail") return false
		},
		name: "アイスボディ",
		rating: 1,
		num: 115
	},
	"アイスフェイス": {
		onStart(pokemon) {
			if (
				this.field.isWeather(["hail", "snow"]) &&
				pokemon.species.id === "eiscuenoice" &&
				!pokemon.transformed
			) {
				this.add("-activate", pokemon, "ability: Ice Face")
				this.effectState.busted = false
				pokemon.formeChange("Eiscue", this.effect, true)
			}
		},
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (
				effect &&
				effect.effectType === "Move" &&
				effect.category === "Physical" &&
				target.species.id === "eiscue" &&
				!target.transformed
			) {
				this.add("-activate", target, "ability: Ice Face")
				this.effectState.busted = true
				return 0
			}
		},
		onCriticalHit(target, type, move) {
			if (!target) return
			if (
				move.category !== "Physical" ||
				target.species.id !== "eiscue" ||
				target.transformed
			)
				return
			if (
				target.volatiles["みがわり"] &&
				!(move.flags["bypasssub"] || move.infiltrates)
			)
				return
			if (!target.runImmunity(move.type)) return
			return false
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return
			if (
				move.category !== "Physical" ||
				target.species.id !== "eiscue" ||
				target.transformed
			)
				return

			const hitSub =
				target.volatiles["みがわり"] &&
				!move.flags["bypasssub"] &&
				!(move.infiltrates && this.gen >= 6)
			if (hitSub) return

			if (!target.runImmunity(move.type)) return
			return 0
		},
		onUpdate(pokemon) {
			if (pokemon.species.id === "eiscue" && this.effectState.busted) {
				pokemon.formeChange("Eiscue-Noice", this.effect, true)
			}
		},
		onWeatherChange(pokemon, source, sourceEffect) {
			// snow/hail resuming because Cloud Nine/Air Lock ended does not trigger Ice Face
			if (sourceEffect?.suppressWeather) return
			if (!pokemon.hp) return
			if (
				this.field.isWeather(["hail", "snow"]) &&
				pokemon.species.id === "eiscuenoice" &&
				!pokemon.transformed
			) {
				this.add("-activate", pokemon, "ability: Ice Face")
				this.effectState.busted = false
				pokemon.formeChange("Eiscue", this.effect, true)
			}
		},
		isBreakable: true,
		isPermanent: true,
		name: "アイスフェイス",
		rating: 3,
		num: 248
	},
	"こおりのりんぷん": {
		onSourceModifyDamage(damage, source, target, move) {
			if (move.category === "Special") {
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "こおりのりんぷん",
		rating: 4,
		num: 246
	},
	"はっこう": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			if (boost.accuracy && boost.accuracy < 0) {
				delete boost.accuracy
				if (!effect.secondaries) {
					this.add(
						"-fail",
						target,
						"unboost",
						"accuracy",
						"[from] ability: Illuminate",
						"[of] " + target
					)
				}
			}
		},
		onModifyMove(move) {
			move.ignoreEvasion = true
		},
		isBreakable: true,
		name: "はっこう",
		rating: 0.5,
		num: 35
	},
	"イリュージョン": {
		onBeforeSwitchIn(pokemon) {
			pokemon.illusion = null
			// yes, you can Illusion an active pokemon but only if it's to your right
			for (let i = pokemon.side.pokemon.length - 1; i > pokemon.position; i--) {
				const possibleTarget = pokemon.side.pokemon[i]
				if (!possibleTarget.fainted) {
					// If Ogerpon is in the last slot while the Illusion Pokemon is Terastallized
					// Illusion will not disguise as anything
					if (
						!pokemon.terastallized ||
						possibleTarget.species.baseSpecies !== "Ogerpon"
					) {
						pokemon.illusion = possibleTarget
					}
					break
				}
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.illusion) {
				this.singleEvent(
					"End",
					this.dex.abilities.get("イリュージョン"),
					target.abilityState,
					target,
					source,
					move
				)
			}
		},
		onEnd(pokemon) {
			if (pokemon.illusion) {
				this.debug("illusion cleared")
				pokemon.illusion = null
				const details =
					pokemon.species.name +
					(pokemon.level === 100 ? "" : ", L" + pokemon.level) +
					(pokemon.gender === "" ? "" : ", " + pokemon.gender) +
					(pokemon.set.shiny ? ", shiny" : "")
				this.add("replace", pokemon, details)
				this.add("-end", pokemon, "イリュージョン")
				if (this.ruleTable.has("illusionlevelmod")) {
					this.hint(
						"Illusion Level Mod is active, so this Pok\u00e9mon's true level was hidden.",
						true
					)
				}
			}
		},
		onFaint(pokemon) {
			pokemon.illusion = null
		},
		name: "イリュージョン",
		rating: 4.5,
		num: 149
	},
	"めんえき": {
		onUpdate(pokemon) {
			if (pokemon.status === "psn" || pokemon.status === "tox") {
				this.add("-activate", pokemon, "ability: Immunity")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "psn" && status.id !== "tox") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Immunity")
			}
			return false
		},
		isBreakable: true,
		name: "めんえき",
		rating: 2,
		num: 17
	},
	"かわりもの": {
		onSwitchIn(pokemon) {
			this.effectState.switchingIn = true
		},
		onStart(pokemon) {
			// Imposter does not activate when Skill Swapped or when Neutralizing Gas leaves the field
			if (!this.effectState.switchingIn) return
			// copies across in doubles/triples
			// (also copies across in multibattle and diagonally in free-for-all,
			// but side.foe already takes care of those)
			const target =
				pokemon.side.foe.active[
				pokemon.side.foe.active.length - 1 - pokemon.position
				]
			if (target) {
				pokemon.transformInto(target, this.dex.abilities.get("かわりもの"))
			}
			this.effectState.switchingIn = false
		},
		name: "かわりもの",
		rating: 5,
		num: 150
	},
	"すりぬけ": {
		onModifyMove(move) {
			move.infiltrates = true
		},
		name: "すりぬけ",
		rating: 2.5,
		num: 151
	},
	"とびだすなかみ": {
		name: "とびだすなかみ",
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.damage(target.getUndynamaxedHP(damage), source, target)
			}
		},
		rating: 4,
		num: 215
	},
	"せいしんりょく": {
		onTryAddVolatile(status, pokemon) {
			if (status.id === "flinch") return null
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === "いかく" && boost.atk) {
				delete boost.atk
				this.add(
					"-fail",
					target,
					"unboost",
					"Attack",
					"[from] ability: Inner Focus",
					"[of] " + target
				)
			}
		},
		isBreakable: true,
		name: "せいしんりょく",
		rating: 1,
		num: 39
	},
	"ふみん": {
		onUpdate(pokemon) {
			if (pokemon.status === "slp") {
				this.add("-activate", pokemon, "ability: Insomnia")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "slp") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Insomnia")
			}
			return false
		},
		onTryAddVolatile(status, target) {
			if (status.id === "あくび") {
				this.add("-immune", target, "[from] ability: Insomnia")
				return null
			}
		},
		isBreakable: true,
		name: "ふみん",
		rating: 1.5,
		num: 15
	},
	"いかく": {
		onStart(pokemon) {
			let activated = false
			for (const target of pokemon.adjacentFoes()) {
				if (!activated) {
					this.add("-ability", pokemon, "いかく", "boost")
					activated = true
				}
				if (target.volatiles["みがわり"]) {
					this.add("-immune", target)
				} else {
					this.boost({ atk: -1 }, target, pokemon, null, true)
				}
			}
		},
		name: "いかく",
		rating: 3.5,
		num: 22
	},
	"ふとうのけん": {
		onStart(pokemon) {
			if (pokemon.swordBoost) return
			pokemon.swordBoost = true
			this.boost({ atk: 1 }, pokemon)
		},
		name: "ふとうのけん",
		rating: 4,
		num: 234
	},
	"てつのトゲ": {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.damage(source.baseMaxhp / 8, source, target)
			}
		},
		name: "てつのトゲ",
		rating: 2.5,
		num: 160
	},
	"てつのこぶし": {
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["punch"]) {
				this.debug("Iron Fist boost")
				return this.chainModify([4915, 4096])
			}
		},
		name: "てつのこぶし",
		rating: 3,
		num: 89
	},
	"せいぎのこころ": {
		onDamagingHit(damage, target, source, move) {
			if (move.type === "Dark") {
				this.boost({ atk: 1 })
			}
		},
		name: "せいぎのこころ",
		rating: 2.5,
		num: 154
	},
	"するどいめ": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			if (boost.accuracy && boost.accuracy < 0) {
				delete boost.accuracy
				if (!effect.secondaries) {
					this.add(
						"-fail",
						target,
						"unboost",
						"accuracy",
						"[from] ability: Keen Eye",
						"[of] " + target
					)
				}
			}
		},
		onModifyMove(move) {
			move.ignoreEvasion = true
		},
		isBreakable: true,
		name: "するどいめ",
		rating: 0.5,
		num: 51
	},
	"ぶきよう": {
		// Item suppression implemented in Pokemon.ignoringItem() within sim/pokemon.js
		onStart(pokemon) {
			this.singleEvent("End", pokemon.getItem(), pokemon.itemState, pokemon)
		},
		name: "ぶきよう",
		rating: -1,
		num: 103
	},
	"リーフガード": {
		onSetStatus(status, target, source, effect) {
			if (["にほんばれ", "おわりのだいち"].includes(target.effectiveWeather())) {
				if (effect?.status) {
					this.add("-immune", target, "[from] ability: Leaf Guard")
				}
				return false
			}
		},
		onTryAddVolatile(status, target) {
			if (
				status.id === "あくび" &&
				["にほんばれ", "おわりのだいち"].includes(target.effectiveWeather())
			) {
				this.add("-immune", target, "[from] ability: Leaf Guard")
				return null
			}
		},
		isBreakable: true,
		name: "リーフガード",
		rating: 0.5,
		num: 102
	},
	"ふゆう": {
		// airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
		isBreakable: true,
		name: "ふゆう",
		rating: 3.5,
		num: 26
	},
	"リベロ": {
		onPrepareHit(source, target, move) {
			if (this.effectState.libero) return
			if (
				move.hasBounced ||
				move.flags["futuremove"] ||
				move.sourceEffect === "snatch"
			)
				return
			const type = move.type
			if (type && type !== "???" && source.getTypes().join() !== type) {
				if (!source.setType(type)) return
				this.effectState.libero = true
				this.add("-start", source, "typechange", type, "[from] ability: Libero")
			}
		},
		onSwitchIn() {
			delete this.effectState.libero
		},
		name: "リベロ",
		rating: 4,
		num: 236
	},
	"ライトメタル": {
		onModifyWeight(weighthg) {
			return this.trunc(weighthg / 2)
		},
		isBreakable: true,
		name: "ライトメタル",
		rating: 1,
		num: 135
	},
	"ひらいしん": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Electric") {
				if (!this.boost({ spa: 1 })) {
					this.add("-immune", target, "[from] ability: Lightning Rod")
				}
				return null
			}
		},
		onAnyRedirectTarget(target, source, source2, move) {
			if (move.type !== "Electric" || move.flags["pledgecombo"]) return
			const redirectTarget = ["randomNormal", "adjacentFoe"].includes(
				move.target
			)
				? "ノーマル"
				: move.target
			if (this.validTarget(this.effectState.target, source, redirectTarget)) {
				if (move.smartTarget) move.smartTarget = false
				if (this.effectState.target !== target) {
					this.add(
						"-activate",
						this.effectState.target,
						"ability: Lightning Rod"
					)
				}
				return this.effectState.target
			}
		},
		isBreakable: true,
		name: "ひらいしん",
		rating: 3,
		num: 31
	},
	"じゅうなん": {
		onUpdate(pokemon) {
			if (pokemon.status === "par") {
				this.add("-activate", pokemon, "ability: Limber")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "par") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Limber")
			}
			return false
		},
		isBreakable: true,
		name: "じゅうなん",
		rating: 2,
		num: 7
	},
	"とれないにおい": {
		onDamagingHit(damage, target, source, move) {
			const sourceAbility = source.getAbility()
			if (sourceAbility.isPermanent || sourceAbility.id === "とれないにおい") {
				return
			}
			if (
				this.checkMoveMakesContact(move, source, target, !source.isAlly(target))
			) {
				const oldAbility = source.setAbility("とれないにおい", target)
				if (oldAbility) {
					this.add(
						"-activate",
						target,
						"ability: Lingering Aroma",
						this.dex.abilities.get(oldAbility).name,
						"[of] " + source
					)
				}
			}
		},
		name: "とれないにおい",
		rating: 2,
		num: 268
	},
	"ヘドロえき": {
		onSourceTryHeal(damage, target, source, effect) {
			this.debug(
				"Heal is occurring: " + target + " <- " + source + " :: " + effect.id
			)
			const canOoze = ["drain", "やどりぎのタネ", "ちからをすいとる"]
			if (canOoze.includes(effect.id)) {
				this.damage(damage)
				return 0
			}
		},
		name: "ヘドロえき",
		rating: 2.5,
		num: 64
	},
	"うるおいボイス": {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			if (move.flags["sound"] && !pokemon.volatiles["dynamax"]) {
				// hardcode
				move.type = "Water"
			}
		},
		name: "うるおいボイス",
		rating: 1.5,
		num: 204
	},
	"えんかく": {
		onModifyMove(move) {
			delete move.flags["contact"]
		},
		name: "えんかく",
		rating: 1,
		num: 203
	},
	"マジックミラー": {
		name: "マジックミラー",
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || !move.flags["reflectable"]) {
				return
			}
			const newMove = this.dex.getActiveMove(move.id)
			newMove.hasBounced = true
			newMove.pranksterBoosted = false
			this.actions.useMove(newMove, target, source)
			return null
		},
		onAllyTryHitSide(target, source, move) {
			if (
				target.isAlly(source) ||
				move.hasBounced ||
				!move.flags["reflectable"]
			) {
				return
			}
			const newMove = this.dex.getActiveMove(move.id)
			newMove.hasBounced = true
			newMove.pranksterBoosted = false
			this.actions.useMove(newMove, this.effectState.target, source)
			return null
		},
		condition: {
			duration: 1
		},
		isBreakable: true,
		rating: 4,
		num: 156
	},
	"マジックガード": {
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== "Move") {
				if (effect.effectType === "Ability")
					this.add("-activate", source, "ability: " + effect.name)
				return false
			}
		},
		name: "マジックガード",
		rating: 4,
		num: 98
	},
	"マジシャン": {
		onAfterMoveSecondarySelf(source, target, move) {
			if (!move || !target || source.switchFlag === true) return
			if (target !== source && move.category !== "Status") {
				if (source.item || source.volatiles["gem"] || move.id === "なげつける")
					return
				const yourItem = target.takeItem(source)
				if (!yourItem) return
				if (!source.setItem(yourItem)) {
					target.item = yourItem.id // bypass setItem so we don't break choicelock or anything
					return
				}
				this.add(
					"-item",
					source,
					yourItem,
					"[from] ability: Magician",
					"[of] " + target
				)
			}
		},
		name: "マジシャン",
		rating: 1,
		num: 170
	},
	"マグマのよろい": {
		onUpdate(pokemon) {
			if (pokemon.status === "frz") {
				this.add("-activate", pokemon, "ability: Magma Armor")
				pokemon.cureStatus()
			}
		},
		onImmunity(type, pokemon) {
			if (type === "frz") return false
		},
		isBreakable: true,
		name: "マグマのよろい",
		rating: 0.5,
		num: 40
	},
	"じりょく": {
		onFoeTrapPokemon(pokemon) {
			if (
				pokemon.hasType("Steel") &&
				pokemon.isAdjacent(this.effectState.target)
			) {
				pokemon.tryTrap(true)
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectState.target
			if (!source || !pokemon.isAdjacent(source)) return
			if (!pokemon.knownType || pokemon.hasType("Steel")) {
				pokemon.maybeTrapped = true
			}
		},
		name: "じりょく",
		rating: 4,
		num: 42
	},
	"ふしぎなうろこ": {
		onModifyDefPriority: 6,
		onModifyDef(def, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5)
			}
		},
		isBreakable: true,
		name: "ふしぎなうろこ",
		rating: 2.5,
		num: 63
	},
	"メガランチャー": {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["pulse"]) {
				return this.chainModify(1.5)
			}
		},
		name: "メガランチャー",
		rating: 3,
		num: 178
	},
	"ひとでなし": {
		onModifyCritRatio(critRatio, source, target) {
			if (target && ["psn", "tox"].includes(target.status)) return 5
		},
		name: "ひとでなし",
		rating: 1.5,
		num: 196
	},
	"ぎたい": {
		onStart(pokemon) {
			this.singleEvent("TerrainChange", this.effect, this.effectState, pokemon)
		},
		onTerrainChange(pokemon) {
			let types
			switch (this.field.terrain) {
				case "エレキフィールド":
					types = ["Electric"]
					break
				case "グラスフィールド":
					types = ["Grass"]
					break
				case "ミストフィールド":
					types = ["Fairy"]
					break
				case "サイコフィールド":
					types = ["サイコキネシス"]
					break
				default:
					types = pokemon.baseSpecies.types
			}
			const oldTypes = pokemon.getTypes()
			if (oldTypes.join() === types.join() || !pokemon.setType(types)) return
			if (this.field.terrain || pokemon.transformed) {
				this.add(
					"-start",
					pokemon,
					"typechange",
					types.join("/"),
					"[from] ability: Mimicry"
				)
				if (!this.field.terrain)
					this.hint(
						"Transform Mimicry changes you to your original un-transformed types."
					)
			} else {
				this.add("-activate", pokemon, "ability: Mimicry")
				this.add("-end", pokemon, "typechange", "[silent]")
			}
		},
		name: "ぎたい",
		rating: 0,
		num: 250
	},
	"しんがん": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			if (boost.accuracy && boost.accuracy < 0) {
				delete boost.accuracy
				if (!effect.secondaries) {
					this.add(
						"-fail",
						target,
						"unboost",
						"accuracy",
						"[from] ability: Mind's Eye",
						"[of] " + target
					)
				}
			}
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			move.ignoreEvasion = true
			if (!move.ignoreImmunity) move.ignoreImmunity = {}
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity["Fighting"] = true
				move.ignoreImmunity["Normal"] = true
			}
		},
		name: "しんがん",
		rating: 0,
		num: 300
	},
	"マイナス": {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			for (const allyActive of pokemon.allies()) {
				if (allyActive.hasAbility(["マイナス", "プラス"])) {
					return this.chainModify(1.5)
				}
			}
		},
		name: "マイナス",
		rating: 0,
		num: 58
	},
	"ミラーアーマー": {
		onTryBoost(boost, target, source, effect) {
			// Don't bounce self stat changes, or boosts that have already bounced
			if (
				!source ||
				target === source ||
				!boost ||
				effect.name === "ミラーアーマー"
			)
				return
			let b
			for (b in boost) {
				if (boost[b] < 0) {
					if (target.boosts[b] === -6) continue
					const negativeBoost = {}
					negativeBoost[b] = boost[b]
					delete boost[b]
					if (source.hp) {
						this.add("-ability", target, "ミラーアーマー")
						this.boost(negativeBoost, source, target, null, true)
					}
				}
			}
		},
		isBreakable: true,
		name: "ミラーアーマー",
		rating: 2,
		num: 240
	},
	"ミストメイカー": {
		onStart(source) {
			this.field.setTerrain("ミストフィールド")
		},
		name: "ミストメイカー",
		rating: 3.5,
		num: 228
	},
	"かたやぶり": {
		onStart(pokemon) {
			this.add("-ability", pokemon, "かたやぶり")
		},
		onModifyMove(move) {
			move.ignoreAbility = true
		},
		name: "かたやぶり",
		rating: 3,
		num: 104
	},
	"ムラっけ": {
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			let stats = []
			const boost = {}
			let statPlus
			for (statPlus in pokemon.boosts) {
				if (statPlus === "accuracy" || statPlus === "evasion") continue
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus)
				}
			}
			let randomStat = stats.length ? this.sample(stats) : undefined
			if (randomStat) boost[randomStat] = 2

			stats = []
			let statMinus
			for (statMinus in pokemon.boosts) {
				if (statMinus === "accuracy" || statMinus === "evasion") continue
				if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
					stats.push(statMinus)
				}
			}
			randomStat = stats.length ? this.sample(stats) : undefined
			if (randomStat) boost[randomStat] = -1

			this.boost(boost, pokemon, pokemon)
		},
		name: "ムラっけ",
		rating: 5,
		num: 141
	},
	"でんきエンジン": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Electric") {
				if (!this.boost({ spe: 1 })) {
					this.add("-immune", target, "[from] ability: Motor Drive")
				}
				return null
			}
		},
		isBreakable: true,
		name: "でんきエンジン",
		rating: 3,
		num: 78
	},
	"じしんかじょう": {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === "Move") {
				this.boost({ atk: length }, source)
			}
		},
		name: "じしんかじょう",
		rating: 3,
		num: 153
	},
	"マルチスケイル": {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug("Multiscale weaken")
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "マルチスケイル",
		rating: 3.5,
		num: 136
	},
	"マルチタイプ": {
		// Multitype's type-changing itself is implemented in statuses.js
		isPermanent: true,
		name: "マルチタイプ",
		rating: 4,
		num: 121
	},
	"ミイラ": {
		name: "ミイラ",
		onDamagingHit(damage, target, source, move) {
			const sourceAbility = source.getAbility()
			if (sourceAbility.isPermanent || sourceAbility.id === "ミイラ") {
				return
			}
			if (
				this.checkMoveMakesContact(move, source, target, !source.isAlly(target))
			) {
				const oldAbility = source.setAbility("ミイラ", target)
				if (oldAbility) {
					this.add(
						"-activate",
						target,
						"ability: Mummy",
						this.dex.abilities.get(oldAbility).name,
						"[of] " + source
					)
				}
			}
		},
		rating: 2,
		num: 152
	},
	"きんしのちから": {
		onFractionalPriorityPriority: -1,
		onFractionalPriority(priority, pokemon, target, move) {
			if (move.category === "Status") {
				return -0.1
			}
		},
		onModifyMove(move) {
			if (move.category === "Status") {
				move.ignoreAbility = true
			}
		},
		name: "きんしのちから",
		rating: 2,
		num: 298
	},
	"しぜんかいふく": {
		onCheckShow(pokemon) {
			// This is complicated
			// For the most part, in-game, it's obvious whether or not Natural Cure activated,
			// since you can see how many of your opponent's pokemon are statused.
			// The only ambiguous situation happens in Doubles/Triples, where multiple pokemon
			// that could have Natural Cure switch out, but only some of them get cured.
			if (pokemon.side.active.length === 1) return
			if (pokemon.showCure === true || pokemon.showCure === false) return

			const cureList = []
			let noCureCount = 0
			for (const curPoke of pokemon.side.active) {
				// pokemon not statused
				if (!curPoke?.status) {
					// this.add('-message', "" + curPoke + " skipped: not statused or doesn't exist");
					continue
				}
				if (curPoke.showCure) {
					// this.add('-message', "" + curPoke + " skipped: Natural Cure already known");
					continue
				}
				const species = curPoke.species
				// pokemon can't get Natural Cure
				if (!Object.values(species.abilities).includes("しぜんかいふく")) {
					// this.add('-message', "" + curPoke + " skipped: no Natural Cure");
					continue
				}
				// pokemon's ability is known to be Natural Cure
				if (!species.abilities["1"] && !species.abilities["H"]) {
					// this.add('-message', "" + curPoke + " skipped: only one ability");
					continue
				}
				// pokemon isn't switching this turn
				if (curPoke !== pokemon && !this.queue.willSwitch(curPoke)) {
					// this.add('-message', "" + curPoke + " skipped: not switching");
					continue
				}

				if (curPoke.hasAbility("しぜんかいふく")) {
					// this.add('-message', "" + curPoke + " confirmed: could be Natural Cure (and is)");
					cureList.push(curPoke)
				} else {
					// this.add('-message', "" + curPoke + " confirmed: could be Natural Cure (but isn't)");
					noCureCount++
				}
			}

			if (!cureList.length || !noCureCount) {
				// It's possible to know what pokemon were cured
				for (const pkmn of cureList) {
					pkmn.showCure = true
				}
			} else {
				// It's not possible to know what pokemon were cured

				// Unlike a -hint, this is real information that battlers need, so we use a -message
				this.add(
					"-message",
					"(" +
					cureList.length +
					" of " +
					pokemon.side.name +
					"'s pokemon " +
					(cureList.length === 1 ? "was" : "were") +
					" cured by Natural Cure.)"
				)

				for (const pkmn of cureList) {
					pkmn.showCure = false
				}
			}
		},
		onSwitchOut(pokemon) {
			if (!pokemon.status) return

			// if pokemon.showCure is undefined, it was skipped because its ability
			// is known
			if (pokemon.showCure === undefined) pokemon.showCure = true

			if (pokemon.showCure)
				this.add(
					"-curestatus",
					pokemon,
					pokemon.status,
					"[from] ability: Natural Cure"
				)
			pokemon.clearStatus()

			// only reset .showCure if it's false
			// (once you know a Pokemon has Natural Cure, its cures are always known)
			if (!pokemon.showCure) pokemon.showCure = undefined
		},
		name: "しぜんかいふく",
		rating: 2.5,
		num: 30
	},
	"ブレインフォース": {
		onModifyDamage(damage, source, target, move) {
			if (move && target.getMoveHitData(move).typeMod > 0) {
				return this.chainModify([5120, 4096])
			}
		},
		name: "ブレインフォース",
		rating: 2.5,
		num: 233
	},
	"かがくへんかガス": {
		// Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
		onPreStart(pokemon) {
			if (pokemon.transformed) return
			this.add("-ability", pokemon, "かがくへんかガス")
			pokemon.abilityState.ending = false
			const strongWeathers = ["おわりのだいち", "はじまりのうみ", "デルタストリーム"]
			for (const target of this.getAllActive()) {
				if (target.hasItem("とくせいガード")) {
					this.add("-block", target, "item: Ability Shield")
					continue
				}
				// Can't suppress a Tatsugiri inside of Dondozo already
				if (target.volatiles["commanding"]) {
					continue
				}
				if (target.illusion) {
					this.singleEvent(
						"End",
						this.dex.abilities.get("イリュージョン"),
						target.abilityState,
						target,
						pokemon,
						"かがくへんかガス"
					)
				}
				if (target.volatiles["スロースタート"]) {
					delete target.volatiles["スロースタート"]
					this.add("-end", target, "スロースタート", "[silent]")
				}
				if (strongWeathers.includes(target.getAbility().id)) {
					this.singleEvent(
						"End",
						this.dex.abilities.get(target.getAbility().id),
						target.abilityState,
						target,
						pokemon,
						"かがくへんかガス"
					)
				}
			}
		},
		onEnd(source) {
			if (source.transformed) return
			for (const pokemon of this.getAllActive()) {
				if (pokemon !== source && pokemon.hasAbility("かがくへんかガス")) {
					return
				}
			}
			this.add("-end", source, "ability: Neutralizing Gas")

			// FIXME this happens before the pokemon switches out, should be the opposite order.
			// Not an easy fix since we cant use a supported event. Would need some kind of special event that
			// gathers events to run after the switch and then runs them when the ability is no longer accessible.
			// (If you're tackling this, do note extreme weathers have the same issue)

			// Mark this pokemon's ability as ending so Pokemon#ignoringAbility skips it
			if (source.abilityState.ending) return
			source.abilityState.ending = true
			const sortedActive = this.getAllActive()
			this.speedSort(sortedActive)
			for (const pokemon of sortedActive) {
				if (pokemon !== source) {
					if (pokemon.getAbility().isPermanent) continue // does not interact with e.g Ice Face, Zen Mode
					if (pokemon.hasItem("とくせいガード")) continue // don't restart abilities that weren't suppressed

					// Will be suppressed by Pokemon#ignoringAbility if needed
					this.singleEvent(
						"Start",
						pokemon.getAbility(),
						pokemon.abilityState,
						pokemon
					)
					if (pokemon.ability === "くいしんぼう") {
						pokemon.abilityState.gluttony = false
					}
				}
			}
		},
		name: "かがくへんかガス",
		rating: 3.5,
		num: 256
	},
	"ノーガード": {
		onAnyInvulnerabilityPriority: 1,
		onAnyInvulnerability(target, source, move) {
			if (
				move &&
				(source === this.effectState.target ||
					target === this.effectState.target)
			)
				return 0
		},
		onAnyAccuracy(accuracy, target, source, move) {
			if (
				move &&
				(source === this.effectState.target ||
					target === this.effectState.target)
			) {
				return true
			}
			return accuracy
		},
		name: "ノーガード",
		rating: 4,
		num: 99
	},
	"ノーマルスキン": {
		onModifyTypePriority: 1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				"hiddenpower",
				"さばきのつぶて",
				"multiattack",
				"naturalgift",
				"めざめるダンス",
				"わるあがき",
				"technoblast",
				"だいちのはどう",
				"ウェザーボール"
			]
			if (
				!(move.isZ && move.category !== "Status") &&
				!noModifyType.includes(move.id) &&
				// TODO: Figure out actual interaction
				!(move.name === "テラバースト" && pokemon.terastallized)
			) {
				move.type = "Normal"
				move.typeChangerBoosted = this.effect
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect)
				return this.chainModify([4915, 4096])
		},
		name: "ノーマルスキン",
		rating: 0,
		num: 96
	},
	"どんかん": {
		onUpdate(pokemon) {
			if (pokemon.volatiles["メロメロ"]) {
				this.add("-activate", pokemon, "ability: Oblivious")
				pokemon.removeVolatile("メロメロ")
				this.add("-end", pokemon, "move: Attract", "[from] ability: Oblivious")
			}
			if (pokemon.volatiles["ちょうはつ"]) {
				this.add("-activate", pokemon, "ability: Oblivious")
				pokemon.removeVolatile("ちょうはつ")
				// Taunt's volatile already sends the -end message when removed
			}
		},
		onImmunity(type, pokemon) {
			if (type === "メロメロ") return false
		},
		onTryHit(pokemon, target, move) {
			if (
				move.id === "メロメロ" ||
				move.id === "captivate" ||
				move.id === "ちょうはつ"
			) {
				this.add("-immune", pokemon, "[from] ability: Oblivious")
				return null
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === "いかく" && boost.atk) {
				delete boost.atk
				this.add(
					"-fail",
					target,
					"unboost",
					"Attack",
					"[from] ability: Oblivious",
					"[of] " + target
				)
			}
		},
		isBreakable: true,
		name: "どんかん",
		rating: 1.5,
		num: 12
	},
	"びんじょう": {
		onFoeAfterBoost(boost, target, source, effect) {
			if (effect?.name === "びんじょう" || effect?.name === "ものまねハーブ")
				return
			const pokemon = this.effectState.target
			const positiveBoosts = {}
			let i
			for (i in boost) {
				if (boost[i] > 0) {
					positiveBoosts[i] = boost[i]
				}
			}
			if (Object.keys(positiveBoosts).length < 1) return
			this.boost(positiveBoosts, pokemon)
		},
		name: "びんじょう",
		rating: 3,
		num: 290
	},
	"ひひいろのこどう": {
		onStart(pokemon) {
			if (this.field.setWeather("にほんばれ")) {
				this.add("-activate", pokemon, "ひひいろのこどう", "[source]")
			} else if (this.field.isWeather("にほんばれ")) {
				this.add("-activate", pokemon, "ability: Orichalcum Pulse")
			}
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				this.debug("Orichalcum boost")
				return this.chainModify([5461, 4096])
			}
		},
		name: "ひひいろのこどう",
		rating: 4.5,
		num: 288
	},
	"ぼうじん": {
		onImmunity(type, pokemon) {
			if (type === "すなあらし" || type === "hail" || type === "powder")
				return false
		},
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (
				move.flags["powder"] &&
				target !== source &&
				this.dex.getImmunity("powder", target)
			) {
				this.add("-immune", target, "[from] ability: Overcoat")
				return null
			}
		},
		isBreakable: true,
		name: "ぼうじん",
		rating: 2,
		num: 142
	},
	"しんりょく": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Overgrow boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Overgrow boost")
				return this.chainModify(1.5)
			}
		},
		name: "しんりょく",
		rating: 2,
		num: 65
	},
	"マイペース": {
		onUpdate(pokemon) {
			if (pokemon.volatiles["ねんりき"]) {
				this.add("-activate", pokemon, "ability: Own Tempo")
				pokemon.removeVolatile("ねんりき")
			}
		},
		onTryAddVolatile(status, pokemon) {
			if (status.id === "ねんりき") return null
		},
		onHit(target, source, move) {
			if (move?.volatileStatus === "ねんりき") {
				this.add("-immune", target, "ねんりき", "[from] ability: Own Tempo")
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === "いかく" && boost.atk) {
				delete boost.atk
				this.add(
					"-fail",
					target,
					"unboost",
					"Attack",
					"[from] ability: Own Tempo",
					"[of] " + target
				)
			}
		},
		isBreakable: true,
		name: "マイペース",
		rating: 1.5,
		num: 20
	},
	"おやこあい": {
		onPrepareHit(source, target, move) {
			if (
				move.category === "Status" ||
				move.multihit ||
				move.flags["noparentalbond"] ||
				move.flags["じゅうでん"] ||
				move.flags["futuremove"] ||
				move.spreadHit ||
				move.isZ ||
				move.isMax
			)
				return
			move.multihit = 2
			move.multihitType = "おやこあい"
		},
		// Damage modifier implemented in BattleActions#modifyDamage()
		onSourceModifySecondaries(secondaries, target, source, move) {
			if (
				move.multihitType === "おやこあい" &&
				move.id === "secretpower" &&
				move.hit < 2
			) {
				// hack to prevent accidentally suppressing King's Rock/Razor Fang
				return secondaries.filter(effect => effect.volatileStatus === "flinch")
			}
		},
		name: "おやこあい",
		rating: 4.5,
		num: 185
	},
	"パステルベール": {
		onStart(pokemon) {
			for (const ally of pokemon.alliesAndSelf()) {
				if (["psn", "tox"].includes(ally.status)) {
					this.add("-activate", pokemon, "ability: Pastel Veil")
					ally.cureStatus()
				}
			}
		},
		onUpdate(pokemon) {
			if (["psn", "tox"].includes(pokemon.status)) {
				this.add("-activate", pokemon, "ability: Pastel Veil")
				pokemon.cureStatus()
			}
		},
		onAllySwitchIn(pokemon) {
			if (["psn", "tox"].includes(pokemon.status)) {
				this.add("-activate", this.effectState.target, "ability: Pastel Veil")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (!["psn", "tox"].includes(status.id)) return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Pastel Veil")
			}
			return false
		},
		onAllySetStatus(status, target, source, effect) {
			if (!["psn", "tox"].includes(status.id)) return
			if (effect?.status) {
				const effectHolder = this.effectState.target
				this.add(
					"-block",
					target,
					"ability: Pastel Veil",
					"[of] " + effectHolder
				)
			}
			return false
		},
		isBreakable: true,
		name: "パステルベール",
		rating: 2,
		num: 257
	},
	"ほろびのボディ": {
		onDamagingHit(damage, target, source, move) {
			if (!this.checkMoveMakesContact(move, source, target)) return

			let announced = false
			for (const pokemon of [target, source]) {
				if (pokemon.volatiles["ほろびのうた"]) continue
				if (!announced) {
					this.add("-ability", target, "ほろびのボディ")
					announced = true
				}
				pokemon.addVolatile("ほろびのうた")
			}
		},
		name: "ほろびのボディ",
		rating: 1,
		num: 253
	},
	"わるいてぐせ": {
		onAfterMoveSecondary(target, source, move) {
			if (source && source !== target && move?.flags["contact"]) {
				if (
					target.item ||
					target.switchFlag ||
					target.forceSwitchFlag ||
					source.switchFlag === true
				) {
					return
				}
				const yourItem = source.takeItem(target)
				if (!yourItem) {
					return
				}
				if (!target.setItem(yourItem)) {
					source.item = yourItem.id
					return
				}
				this.add(
					"-enditem",
					source,
					yourItem,
					"[silent]",
					"[from] ability: Pickpocket",
					"[of] " + source
				)
				this.add(
					"-item",
					target,
					yourItem,
					"[from] ability: Pickpocket",
					"[of] " + source
				)
			}
		},
		name: "わるいてぐせ",
		rating: 1,
		num: 124
	},
	"ものひろい": {
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (pokemon.item) return
			const pickupTargets = this.getAllActive().filter(
				target =>
					target.lastItem &&
					target.usedItemThisTurn &&
					pokemon.isAdjacent(target)
			)
			if (!pickupTargets.length) return
			const randomTarget = this.sample(pickupTargets)
			const item = randomTarget.lastItem
			randomTarget.lastItem = ""
			this.add(
				"-item",
				pokemon,
				this.dex.items.get(item),
				"[from] ability: Pickup"
			)
			pokemon.setItem(item)
		},
		name: "ものひろい",
		rating: 0.5,
		num: 53
	},
	"フェアリースキン": {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				"さばきのつぶて",
				"multiattack",
				"naturalgift",
				"めざめるダンス",
				"technoblast",
				"だいちのはどう",
				"ウェザーボール"
			]
			if (
				move.type === "Normal" &&
				!noModifyType.includes(move.id) &&
				!(move.isZ && move.category !== "Status") &&
				!(move.name === "テラバースト" && pokemon.terastallized)
			) {
				move.type = "Fairy"
				move.typeChangerBoosted = this.effect
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect)
				return this.chainModify([4915, 4096])
		},
		name: "フェアリースキン",
		rating: 4,
		num: 182
	},
	"プラス": {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			for (const allyActive of pokemon.allies()) {
				if (allyActive.hasAbility(["マイナス", "プラス"])) {
					return this.chainModify(1.5)
				}
			}
		},
		name: "プラス",
		rating: 0,
		num: 57
	},
	"ポイズンヒール": {
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (effect.id === "psn" || effect.id === "tox") {
				this.heal(target.baseMaxhp / 8)
				return false
			}
		},
		name: "ポイズンヒール",
		rating: 4,
		num: 90
	},
	"どくのトゲ": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus("psn", target)
				}
			}
		},
		name: "どくのトゲ",
		rating: 1.5,
		num: 38
	},
	"どくしゅ": {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Poison Touch's effect
			if (target.hasAbility("りんぷん") || target.hasItem("おんみつマント"))
				return
			if (this.checkMoveMakesContact(move, target, source)) {
				if (this.randomChance(3, 10)) {
					target.trySetStatus("psn", source)
				}
			}
		},
		name: "どくしゅ",
		rating: 2,
		num: 143
	},
	"スワームチェンジ": {
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== "Zygarde" ||
				pokemon.transformed ||
				!pokemon.hp
			)
				return
			if (
				pokemon.species.id === "zygardecomplete" ||
				pokemon.hp > pokemon.maxhp / 2
			)
				return
			this.add("-activate", pokemon, "ability: Power Construct")
			pokemon.formeChange("Zygarde-Complete", this.effect, true)
			pokemon.baseMaxhp = Math.floor(
				(Math.floor(
					2 * pokemon.species.baseStats["hp"] +
					pokemon.set.ivs["hp"] +
					Math.floor(pokemon.set.evs["hp"] / 4) +
					100
				) *
					pokemon.level) /
				100 +
				10
			)
			const newMaxHP = pokemon.volatiles["dynamax"]
				? 2 * pokemon.baseMaxhp
				: pokemon.baseMaxhp
			pokemon.hp = newMaxHP - (pokemon.maxhp - pokemon.hp)
			pokemon.maxhp = newMaxHP
			this.add("-heal", pokemon, pokemon.getHealth, "[silent]")
		},
		isPermanent: true,
		name: "スワームチェンジ",
		rating: 5,
		num: 211
	},
	"かがくのちから": {
		onAllyFaint(target) {
			if (!this.effectState.target.hp) return
			const ability = target.getAbility()
			const additionalBannedAbilities = [
				"noability",
				"しれいとう",
				"フラワーギフト",
				"てんきや",
				"はらぺこスイッチ",
				"イリュージョン",
				"かわりもの",
				"かがくへんかガス",
				"かがくのちから",
				"レシーバー",
				"トレース",
				"ふしぎなまもり"
			]
			if (
				target.getAbility().isPermanent ||
				additionalBannedAbilities.includes(target.ability)
			)
				return
			if (this.effectState.target.setAbility(ability)) {
				this.add(
					"-ability",
					this.effectState.target,
					ability,
					"[from] ability: Power of Alchemy",
					"[of] " + target
				)
			}
		},
		name: "かがくのちから",
		rating: 0,
		num: 223
	},
	"パワースポット": {
		onAllyBasePowerPriority: 22,
		onAllyBasePower(basePower, attacker, defender, move) {
			if (attacker !== this.effectState.target) {
				this.debug("Power Spot boost")
				return this.chainModify([5325, 4096])
			}
		},
		name: "パワースポット",
		rating: 0,
		num: 249
	},
	"いたずらごころ": {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === "Status") {
				move.pranksterBoosted = true
				return priority + 1
			}
		},
		name: "いたずらごころ",
		rating: 4,
		num: 158
	},
	"プレッシャー": {
		onStart(pokemon) {
			this.add("-ability", pokemon, "プレッシャー")
		},
		onDeductPP(target, source) {
			if (target.isAlly(source)) return
			return 1
		},
		name: "プレッシャー",
		rating: 2.5,
		num: 46
	},
	"はじまりのうみ": {
		onStart(source) {
			this.field.setWeather("はじまりのうみ")
		},
		onAnySetWeather(target, source, weather) {
			const strongWeathers = ["おわりのだいち", "はじまりのうみ", "デルタストリーム"]
			if (
				this.field.getWeather().id === "はじまりのうみ" &&
				!strongWeathers.includes(weather.id)
			)
				return false
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue
				if (target.hasAbility("はじまりのうみ")) {
					this.field.weatherState.source = target
					return
				}
			}
			this.field.clearWeather()
		},
		name: "はじまりのうみ",
		rating: 4.5,
		num: 189
	},
	"プリズムアーマー": {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				this.debug("Prism Armor neutralize")
				return this.chainModify(0.75)
			}
		},
		name: "プリズムアーマー",
		rating: 3,
		num: 232
	},
	"スクリューおびれ": {
		onModifyMovePriority: 1,
		onModifyMove(move) {
			// most of the implementation is in Battle#getTarget
			move.tracksTarget = move.target !== "scripted"
		},
		name: "スクリューおびれ",
		rating: 0,
		num: 239
	},
	"へんげんじざい": {
		onPrepareHit(source, target, move) {
			if (this.effectState.protean) return
			if (
				move.hasBounced ||
				move.flags["futuremove"] ||
				move.sourceEffect === "snatch"
			)
				return
			const type = move.type
			if (type && type !== "???" && source.getTypes().join() !== type) {
				if (!source.setType(type)) return
				this.effectState.protean = true
				this.add(
					"-start",
					source,
					"typechange",
					type,
					"[from] ability: Protean"
				)
			}
		},
		onSwitchIn(pokemon) {
			delete this.effectState.protean
		},
		name: "へんげんじざい",
		rating: 4,
		num: 168
	},
	"こだいかっせい": {
		onStart(pokemon) {
			this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon)
		},
		onWeatherChange(pokemon) {
			if (pokemon.transformed) return
			// Protosynthesis is not affected by Utility Umbrella
			if (this.field.isWeather("にほんばれ")) {
				pokemon.addVolatile("こだいかっせい")
			} else if (!pokemon.volatiles["こだいかっせい"]?.fromBooster) {
				pokemon.removeVolatile("こだいかっせい")
			}
		},
		onEnd(pokemon) {
			delete pokemon.volatiles["こだいかっせい"]
			this.add("-end", pokemon, "こだいかっせい", "[silent]")
		},
		condition: {
			noCopy: true,
			onStart(pokemon, source, effect) {
				if (effect?.id === "ブーストエナジー") {
					this.effectState.fromBooster = true
					this.add(
						"-activate",
						pokemon,
						"ability: Protosynthesis",
						"[fromitem]"
					)
				} else {
					this.add("-activate", pokemon, "ability: Protosynthesis")
				}
				this.effectState.bestStat = pokemon.getBestStat(false, true)
				this.add(
					"-start",
					pokemon,
					"こだいかっせい" + this.effectState.bestStat
				)
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, source, target, move) {
				if (this.effectState.bestStat !== "atk") return
				this.debug("Protosynthesis atk boost")
				return this.chainModify([5325, 4096])
			},
			onModifyDefPriority: 6,
			onModifyDef(def, target, source, move) {
				if (this.effectState.bestStat !== "def") return
				this.debug("Protosynthesis def boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpAPriority: 5,
			onModifySpA(relayVar, source, target, move) {
				if (this.effectState.bestStat !== "spa") return
				this.debug("Protosynthesis spa boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpDPriority: 6,
			onModifySpD(relayVar, target, source, move) {
				if (this.effectState.bestStat !== "spd") return
				this.debug("Protosynthesis spd boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpe(spe, pokemon) {
				if (this.effectState.bestStat !== "spe") return
				this.debug("Protosynthesis spe boost")
				return this.chainModify(1.5)
			},
			onEnd(pokemon) {
				this.add("-end", pokemon, "こだいかっせい")
			}
		},
		isPermanent: true,
		name: "こだいかっせい",
		rating: 3,
		num: 281
	},
	"サイコメイカー": {
		onStart(source) {
			this.field.setTerrain("サイコフィールド")
		},
		name: "サイコメイカー",
		rating: 4,
		num: 227
	},
	"パンクロック": {
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["sound"]) {
				this.debug("Punk Rock boost")
				return this.chainModify([5325, 4096])
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.flags["sound"]) {
				this.debug("Punk Rock weaken")
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "パンクロック",
		rating: 3.5,
		num: 244
	},
	"ヨガパワー": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk) {
			return this.chainModify(2)
		},
		name: "ヨガパワー",
		rating: 5,
		num: 74
	},
	"きよめのしお": {
		onSetStatus(status, target, source, effect) {
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Purifying Salt")
			}
			return false
		},
		onTryAddVolatile(status, target) {
			if (status.id === "あくび") {
				this.add("-immune", target, "[from] ability: Purifying Salt")
				return null
			}
		},
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Ghost") {
				this.debug("Purifying Salt weaken")
				return this.chainModify(0.5)
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(spa, attacker, defender, move) {
			if (move.type === "Ghost") {
				this.debug("Purifying Salt weaken")
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "きよめのしお",
		rating: 4,
		num: 272
	},
	"クォークチャージ": {
		onStart(pokemon) {
			this.singleEvent("TerrainChange", this.effect, this.effectState, pokemon)
		},
		onTerrainChange(pokemon) {
			if (pokemon.transformed) return
			if (this.field.isTerrain("エレキフィールド")) {
				pokemon.addVolatile("クォークチャージ")
			} else if (!pokemon.volatiles["クォークチャージ"]?.fromBooster) {
				pokemon.removeVolatile("クォークチャージ")
			}
		},
		onEnd(pokemon) {
			delete pokemon.volatiles["クォークチャージ"]
			this.add("-end", pokemon, "クォークチャージ", "[silent]")
		},
		condition: {
			noCopy: true,
			onStart(pokemon, source, effect) {
				if (effect?.id === "ブーストエナジー") {
					this.effectState.fromBooster = true
					this.add("-activate", pokemon, "ability: Quark Drive", "[fromitem]")
				} else {
					this.add("-activate", pokemon, "ability: Quark Drive")
				}
				this.effectState.bestStat = pokemon.getBestStat(false, true)
				this.add("-start", pokemon, "クォークチャージ" + this.effectState.bestStat)
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, source, target, move) {
				if (this.effectState.bestStat !== "atk") return
				this.debug("Quark Drive atk boost")
				return this.chainModify([5325, 4096])
			},
			onModifyDefPriority: 6,
			onModifyDef(def, target, source, move) {
				if (this.effectState.bestStat !== "def") return
				this.debug("Quark Drive def boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpAPriority: 5,
			onModifySpA(relayVar, source, target, move) {
				if (this.effectState.bestStat !== "spa") return
				this.debug("Quark Drive spa boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpDPriority: 6,
			onModifySpD(relayVar, target, source, move) {
				if (this.effectState.bestStat !== "spd") return
				this.debug("Quark Drive spd boost")
				return this.chainModify([5325, 4096])
			},
			onModifySpe(spe, pokemon) {
				if (this.effectState.bestStat !== "spe") return
				this.debug("Quark Drive spe boost")
				return this.chainModify(1.5)
			},
			onEnd(pokemon) {
				this.add("-end", pokemon, "クォークチャージ")
			}
		},
		isPermanent: true,
		name: "クォークチャージ",
		rating: 3,
		num: 282
	},
	"じょおうのいげん": {
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ["ほろびのうた", "flowershield", "rototiller"]
			if (
				move.target === "foeSide" ||
				(move.target === "all" && !targetAllExceptions.includes(move.id))
			) {
				return
			}

			const dazzlingHolder = this.effectState.target
			if (
				(source.isAlly(dazzlingHolder) || move.target === "all") &&
				move.priority > 0.1
			) {
				this.attrLastMove("[still]")
				this.add(
					"cant",
					dazzlingHolder,
					"ability: Queenly Majesty",
					move,
					"[of] " + target
				)
				return false
			}
		},
		isBreakable: true,
		name: "じょおうのいげん",
		rating: 2.5,
		num: 214
	},
	"クイックドロウ": {
		onFractionalPriorityPriority: -1,
		onFractionalPriority(priority, pokemon, target, move) {
			if (move.category !== "Status" && this.randomChance(3, 10)) {
				this.add("-activate", pokemon, "ability: Quick Draw")
				return 0.1
			}
		},
		name: "クイックドロウ",
		rating: 2.5,
		num: 259
	},
	"はやあし": {
		onModifySpe(spe, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5)
			}
		},
		name: "はやあし",
		rating: 2.5,
		num: 95
	},
	"あめうけざら": {
		onWeather(target, source, effect) {
			if (target.hasItem("ばんのうがさ")) return
			if (effect.id === "あまごい" || effect.id === "はじまりのうみ") {
				this.heal(target.baseMaxhp / 16)
			}
		},
		name: "あめうけざら",
		rating: 1.5,
		num: 44
	},
	"びびり": {
		onDamagingHit(damage, target, source, move) {
			if (["Dark", "Bug", "Ghost"].includes(move.type)) {
				this.boost({ spe: 1 })
			}
		},
		onAfterBoost(boost, target, source, effect) {
			if (effect?.name === "いかく") {
				this.boost({ spe: 1 })
			}
		},
		name: "びびり",
		rating: 1,
		num: 155
	},
	"レシーバー": {
		onAllyFaint(target) {
			if (!this.effectState.target.hp) return
			const ability = target.getAbility()
			const additionalBannedAbilities = [
				"noability",
				"しれいとう",
				"フラワーギフト",
				"てんきや",
				"はらぺこスイッチ",
				"イリュージョン",
				"かわりもの",
				"かがくへんかガス",
				"かがくのちから",
				"レシーバー",
				"トレース",
				"ふしぎなまもり"
			]
			if (
				target.getAbility().isPermanent ||
				additionalBannedAbilities.includes(target.ability)
			)
				return
			if (this.effectState.target.setAbility(ability)) {
				this.add(
					"-ability",
					this.effectState.target,
					ability,
					"[from] ability: Receiver",
					"[of] " + target
				)
			}
		},
		name: "レシーバー",
		rating: 0,
		num: 222
	},
	"すてみ": {
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.recoil || move.hasCrashDamage) {
				this.debug("Reckless boost")
				return this.chainModify([4915, 4096])
			}
		},
		name: "すてみ",
		rating: 3,
		num: 120
	},
	"フリーズスキン": {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				"さばきのつぶて",
				"multiattack",
				"naturalgift",
				"めざめるダンス",
				"technoblast",
				"だいちのはどう",
				"ウェザーボール"
			]
			if (
				move.type === "Normal" &&
				!noModifyType.includes(move.id) &&
				!(move.isZ && move.category !== "Status") &&
				!(move.name === "テラバースト" && pokemon.terastallized)
			) {
				move.type = "Ice"
				move.typeChangerBoosted = this.effect
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect)
				return this.chainModify([4915, 4096])
		},
		name: "フリーズスキン",
		rating: 4,
		num: 174
	},
	"さいせいりょく": {
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3)
		},
		name: "さいせいりょく",
		rating: 4.5,
		num: 144
	},
	"じゅくせい": {
		onTryHeal(damage, target, source, effect) {
			if (!effect) return
			if (effect.name === "Berry Juice" || effect.name === "たべのこし") {
				this.add("-activate", target, "ability: Ripen")
			}
			if (effect.isBerry) return this.chainModify(2)
		},
		onChangeBoost(boost, target, source, effect) {
			if (effect && effect.isBerry) {
				let b
				for (b in boost) {
					boost[b] *= 2
				}
			}
		},
		onSourceModifyDamagePriority: -1,
		onSourceModifyDamage(damage, source, target, move) {
			if (target.abilityState.berryWeaken) {
				target.abilityState.berryWeaken = false
				return this.chainModify(0.5)
			}
		},
		onTryEatItemPriority: -1,
		onTryEatItem(item, pokemon) {
			this.add("-activate", pokemon, "ability: Ripen")
		},
		onEatItem(item, pokemon) {
			const weakenBerries = [
				"リリバのみ",
				"ヨロギのみ",
				"ホズのみ",
				"ヨプのみ",
				"バコウのみ",
				"ナモのみ",
				"ハバンのみ",
				"カシブのみ",
				"ビアーのみ",
				"オッカのみ",
				"イトケのみ",
				"ウタンのみ",
				"リンドのみ",
				"ロゼルのみ",
				"シュカのみ",
				"タンガのみ",
				"ソクノのみ",
				"ヤチェのみ"
			]
			// Record if the pokemon ate a berry to resist the attack
			pokemon.abilityState.berryWeaken = weakenBerries.includes(item.name)
		},
		name: "じゅくせい",
		rating: 2,
		num: 247
	},
	"とうそうしん": {
		onBasePowerPriority: 24,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.gender && defender.gender) {
				if (attacker.gender === defender.gender) {
					this.debug("Rivalry boost")
					return this.chainModify(1.25)
				} else {
					this.debug("Rivalry weaken")
					return this.chainModify(0.75)
				}
			}
		},
		name: "とうそうしん",
		rating: 0,
		num: 79
	},
	"ARシステム": {
		// RKS System's type-changing itself is implemented in statuses.js
		isPermanent: true,
		name: "ARシステム",
		rating: 4,
		num: 225
	},
	"いしあたま": {
		onDamage(damage, target, source, effect) {
			if (effect.id === "recoil") {
				if (!this.activeMove) throw new Error("Battle.activeMove is null")
				if (this.activeMove.id !== "わるあがき") return null
			}
		},
		name: "いしあたま",
		rating: 3,
		num: 69
	},
	"いわはこび": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Rock") {
				this.debug("Rocky Payload boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Rock") {
				this.debug("Rocky Payload boost")
				return this.chainModify(1.5)
			}
		},
		name: "いわはこび",
		rating: 3.5,
		num: 276
	},
	"さめはだ": {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.damage(source.baseMaxhp / 8, source, target)
			}
		},
		name: "さめはだ",
		rating: 2.5,
		num: 24
	},
	"にげあし": {
		name: "にげあし",
		rating: 0,
		num: 50
	},
	"すなのちから": {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.field.isWeather("すなあらし")) {
				if (
					move.type === "Rock" ||
					move.type === "じめん" ||
					move.type === "Steel"
				) {
					this.debug("Sand Force boost")
					return this.chainModify([5325, 4096])
				}
			}
		},
		onImmunity(type, pokemon) {
			if (type === "すなあらし") return false
		},
		name: "すなのちから",
		rating: 2,
		num: 159
	},
	"すなかき": {
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather("すなあらし")) {
				return this.chainModify(2)
			}
		},
		onImmunity(type, pokemon) {
			if (type === "すなあらし") return false
		},
		name: "すなかき",
		rating: 3,
		num: 146
	},
	"すなはき": {
		onDamagingHit(damage, target, source, move) {
			this.field.setWeather("すなあらし")
		},
		name: "すなはき",
		rating: 1,
		num: 245
	},
	"すなおこし": {
		onStart(source) {
			this.field.setWeather("すなあらし")
		},
		name: "すなおこし",
		rating: 4,
		num: 45
	},
	"すながくれ": {
		onImmunity(type, pokemon) {
			if (type === "すなあらし") return false
		},
		onModifyAccuracyPriority: -1,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== "number") return
			if (this.field.isWeather("すなあらし")) {
				this.debug("Sand Veil - decreasing accuracy")
				return this.chainModify([3277, 4096])
			}
		},
		isBreakable: true,
		name: "すながくれ",
		rating: 1.5,
		num: 8
	},
	"そうしょく": {
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Grass") {
				if (!this.boost({ atk: 1 })) {
					this.add("-immune", target, "[from] ability: Sap Sipper")
				}
				return null
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (source === this.effectState.target || !target.isAlly(source)) return
			if (move.type === "Grass") {
				this.boost({ atk: 1 }, this.effectState.target)
			}
		},
		isBreakable: true,
		name: "そうしょく",
		rating: 3,
		num: 157
	},
	"ぎょぐん": {
		onStart(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== "Wishiwashi" ||
				pokemon.level < 20 ||
				pokemon.transformed
			)
				return
			if (pokemon.hp > pokemon.maxhp / 4) {
				if (pokemon.species.id === "wishiwashi") {
					pokemon.formeChange("Wishiwashi-School")
				}
			} else {
				if (pokemon.species.id === "wishiwashischool") {
					pokemon.formeChange("Wishiwashi")
				}
			}
		},
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== "Wishiwashi" ||
				pokemon.level < 20 ||
				pokemon.transformed ||
				!pokemon.hp
			)
				return
			if (pokemon.hp > pokemon.maxhp / 4) {
				if (pokemon.species.id === "wishiwashi") {
					pokemon.formeChange("Wishiwashi-School")
				}
			} else {
				if (pokemon.species.id === "wishiwashischool") {
					pokemon.formeChange("Wishiwashi")
				}
			}
		},
		isPermanent: true,
		name: "ぎょぐん",
		rating: 3,
		num: 208
	},
	"きもったま": {
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {}
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity["Fighting"] = true
				move.ignoreImmunity["Normal"] = true
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === "いかく" && boost.atk) {
				delete boost.atk
				this.add(
					"-fail",
					target,
					"unboost",
					"Attack",
					"[from] ability: Scrappy",
					"[of] " + target
				)
			}
		},
		name: "きもったま",
		rating: 3,
		num: 113
	},
	"バリアフリー": {
		onStart(pokemon) {
			let activated = false
			for (const sideCondition of ["リフレクター", "ひかりのかべ", "オーロラベール"]) {
				for (const side of [
					pokemon.side,
					...pokemon.side.foeSidesWithConditions()
				]) {
					if (side.getSideCondition(sideCondition)) {
						if (!activated) {
							this.add("-activate", pokemon, "ability: Screen Cleaner")
							activated = true
						}
						side.removeSideCondition(sideCondition)
					}
				}
			}
		},
		name: "バリアフリー",
		rating: 2,
		num: 251
	},
	"こぼれダネ": {
		onDamagingHit(damage, target, source, move) {
			this.field.setTerrain("グラスフィールド")
		},
		name: "こぼれダネ",
		rating: 2.5,
		num: 269
	},
	"てんのめぐみ": {
		onModifyMovePriority: -2,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug("doubling secondary chance")
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2
				}
			}
			if (move.self?.chance) move.self.chance *= 2
		},
		name: "てんのめぐみ",
		rating: 3.5,
		num: 32
	},
	"ファントムガード": {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug("Shadow Shield weaken")
				return this.chainModify(0.5)
			}
		},
		name: "ファントムガード",
		rating: 3.5,
		num: 231
	},
	"かげふみ": {
		onFoeTrapPokemon(pokemon) {
			if (
				!pokemon.hasAbility("かげふみ") &&
				pokemon.isAdjacent(this.effectState.target)
			) {
				pokemon.tryTrap(true)
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectState.target
			if (!source || !pokemon.isAdjacent(source)) return
			if (!pokemon.hasAbility("かげふみ")) {
				pokemon.maybeTrapped = true
			}
		},
		name: "かげふみ",
		rating: 5,
		num: 23
	},
	"きれあじ": {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["slicing"]) {
				this.debug("Shapness boost")
				return this.chainModify(1.5)
			}
		},
		name: "きれあじ",
		rating: 3.5,
		num: 292
	},
	"だっぴ": {
		onResidualOrder: 5,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			if (pokemon.hp && pokemon.status && this.randomChance(33, 100)) {
				this.debug("shed skin")
				this.add("-activate", pokemon, "ability: Shed Skin")
				pokemon.cureStatus()
			}
		},
		name: "だっぴ",
		rating: 3,
		num: 61
	},
	"ちからずく": {
		onModifyMove(move, pokemon) {
			if (move.secondaries) {
				delete move.secondaries
				// Technically not a secondary effect, but it is negated
				delete move.self
				if (move.id === "clangoroussoulblaze") delete move.selfBoost
				// Actual negation of `AfterMoveSecondary` effects implemented in scripts.js
				move.hasSheerForce = true
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.hasSheerForce) return this.chainModify([5325, 4096])
		},
		name: "ちからずく",
		rating: 3.5,
		num: 125
	},
	"シェルアーマー": {
		onCriticalHit: false,
		isBreakable: true,
		name: "シェルアーマー",
		rating: 1,
		num: 75
	},
	"りんぷん": {
		onModifySecondaries(secondaries) {
			this.debug("Shield Dust prevent secondary")
			return secondaries.filter(effect => !!(effect.self || effect.dustproof))
		},
		isBreakable: true,
		name: "りんぷん",
		rating: 2,
		num: 19
	},
	"リミットシールド": {
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== "Minior" || pokemon.transformed)
				return
			if (pokemon.hp > pokemon.maxhp / 2) {
				if (pokemon.species.forme !== "Meteor") {
					pokemon.formeChange("Minior-Meteor")
				}
			} else {
				if (pokemon.species.forme === "Meteor") {
					pokemon.formeChange(pokemon.set.species)
				}
			}
		},
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== "Minior" ||
				pokemon.transformed ||
				!pokemon.hp
			)
				return
			if (pokemon.hp > pokemon.maxhp / 2) {
				if (pokemon.species.forme !== "Meteor") {
					pokemon.formeChange("Minior-Meteor")
				}
			} else {
				if (pokemon.species.forme === "Meteor") {
					pokemon.formeChange(pokemon.set.species)
				}
			}
		},
		onSetStatus(status, target, source, effect) {
			if (target.species.id !== "miniormeteor" || target.transformed) return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Shields Down")
			}
			return false
		},
		onTryAddVolatile(status, target) {
			if (target.species.id !== "miniormeteor" || target.transformed) return
			if (status.id !== "あくび") return
			this.add("-immune", target, "[from] ability: Shields Down")
			return null
		},
		isPermanent: true,
		name: "リミットシールド",
		rating: 3,
		num: 197
	},
	"たんじゅん": {
		onChangeBoost(boost, target, source, effect) {
			if (effect && effect.id === "zpower") return
			let i
			for (i in boost) {
				boost[i] *= 2
			}
		},
		isBreakable: true,
		name: "たんじゅん",
		rating: 4,
		num: 86
	},
	"スキルリンク": {
		onModifyMove(move) {
			if (
				move.multihit &&
				Array.isArray(move.multihit) &&
				move.multihit.length
			) {
				move.multihit = move.multihit[1]
			}
			if (move.multiaccuracy) {
				delete move.multiaccuracy
			}
		},
		name: "スキルリンク",
		rating: 3,
		num: 92
	},
	"スロースタート": {
		onStart(pokemon) {
			pokemon.addVolatile("スロースタート")
		},
		onEnd(pokemon) {
			delete pokemon.volatiles["スロースタート"]
			this.add("-end", pokemon, "スロースタート", "[silent]")
		},
		condition: {
			duration: 5,
			onResidualOrder: 28,
			onResidualSubOrder: 2,
			onStart(target) {
				this.add("-start", target, "ability: Slow Start")
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, pokemon) {
				return this.chainModify(0.5)
			},
			onModifySpe(spe, pokemon) {
				return this.chainModify(0.5)
			},
			onEnd(target) {
				this.add("-end", target, "スロースタート")
			}
		},
		name: "スロースタート",
		rating: -1,
		num: 112
	},
	"ゆきかき": {
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather(["hail", "snow"])) {
				return this.chainModify(2)
			}
		},
		name: "ゆきかき",
		rating: 3,
		num: 202
	},
	"スナイパー": {
		onModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).crit) {
				this.debug("Sniper boost")
				return this.chainModify(1.5)
			}
		},
		name: "スナイパー",
		rating: 2,
		num: 97
	},
	"ゆきがくれ": {
		onImmunity(type, pokemon) {
			if (type === "hail") return false
		},
		onModifyAccuracyPriority: -1,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== "number") return
			if (this.field.isWeather(["hail", "snow"])) {
				this.debug("Snow Cloak - decreasing accuracy")
				return this.chainModify([3277, 4096])
			}
		},
		isBreakable: true,
		name: "ゆきがくれ",
		rating: 1.5,
		num: 81
	},
	"ゆきふらし": {
		onStart(source) {
			this.field.setWeather("snow")
		},
		name: "ゆきふらし",
		rating: 4,
		num: 117
	},
	"サンパワー": {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			if (["にほんばれ", "おわりのだいち"].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5)
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem("ばんのうがさ")) return
			if (effect.id === "にほんばれ" || effect.id === "おわりのだいち") {
				this.damage(target.baseMaxhp / 8, target, target)
			}
		},
		name: "サンパワー",
		rating: 2,
		num: 94
	},
	"ハードロック": {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				this.debug("Solid Rock neutralize")
				return this.chainModify(0.75)
			}
		},
		isBreakable: true,
		name: "ハードロック",
		rating: 3,
		num: 116
	},
	"ソウルハート": {
		onAnyFaintPriority: 1,
		onAnyFaint() {
			this.boost({ spa: 1 }, this.effectState.target)
		},
		name: "ソウルハート",
		rating: 3.5,
		num: 220
	},
	"ぼうおん": {
		onTryHit(target, source, move) {
			if (target !== source && move.flags["sound"]) {
				this.add("-immune", target, "[from] ability: Soundproof")
				return null
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (move.flags["sound"]) {
				this.add(
					"-immune",
					this.effectState.target,
					"[from] ability: Soundproof"
				)
			}
		},
		isBreakable: true,
		name: "ぼうおん",
		rating: 2,
		num: 43
	},
	"かそく": {
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (pokemon.activeTurns) {
				this.boost({ spe: 1 })
			}
		},
		name: "かそく",
		rating: 4.5,
		num: 3
	},
	"はりこみ": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug("Stakeout boost")
				return this.chainModify(2)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug("Stakeout boost")
				return this.chainModify(2)
			}
		},
		name: "はりこみ",
		rating: 4.5,
		num: 198
	},
	"あとだし": {
		onFractionalPriority: -0.1,
		name: "あとだし",
		rating: -1,
		num: 100
	},
	"すじがねいり": {
		onModifyMovePriority: 1,
		onModifyMove(move) {
			// most of the implementation is in Battle#getTarget
			move.tracksTarget = move.target !== "scripted"
		},
		name: "すじがねいり",
		rating: 0,
		num: 242
	},
	"じきゅうりょく": {
		onDamagingHit(damage, target, source, effect) {
			this.boost({ def: 1 })
		},
		name: "じきゅうりょく",
		rating: 3.5,
		num: 192
	},
	"バトルスイッチ": {
		onModifyMovePriority: 1,
		onModifyMove(move, attacker, defender) {
			if (attacker.species.baseSpecies !== "Aegislash" || attacker.transformed)
				return
			if (move.category === "Status" && move.id !== "kingsshield") return
			const targetForme =
				move.id === "kingsshield" ? "Aegislash" : "Aegislash-Blade"
			if (attacker.species.name !== targetForme)
				attacker.formeChange(targetForme)
		},
		isPermanent: true,
		name: "バトルスイッチ",
		rating: 4,
		num: 176
	},
	"せいでんき": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus("par", target)
				}
			}
		},
		name: "せいでんき",
		rating: 2,
		num: 9
	},
	"ふくつのこころ": {
		onFlinch(pokemon) {
			this.boost({ spe: 1 })
		},
		name: "ふくつのこころ",
		rating: 1,
		num: 80
	},
	"じょうききかん": {
		onDamagingHit(damage, target, source, move) {
			if (["Water", "Fire"].includes(move.type)) {
				this.boost({ spe: 6 })
			}
		},
		name: "じょうききかん",
		rating: 2,
		num: 243
	},
	"はがねつかい": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Steel") {
				this.debug("Steelworker boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Steel") {
				this.debug("Steelworker boost")
				return this.chainModify(1.5)
			}
		},
		name: "はがねつかい",
		rating: 3.5,
		num: 200
	},
	"はがねのせいしん": {
		onAllyBasePowerPriority: 22,
		onAllyBasePower(basePower, attacker, defender, move) {
			if (move.type === "Steel") {
				this.debug("Steely Spirit boost")
				return this.chainModify(1.5)
			}
		},
		name: "はがねのせいしん",
		rating: 3.5,
		num: 252
	},
	"あくしゅう": {
		onModifyMovePriority: -1,
		onModifyMove(move) {
			if (move.category !== "Status") {
				this.debug("Adding Stench flinch")
				if (!move.secondaries) move.secondaries = []
				for (const secondary of move.secondaries) {
					if (secondary.volatileStatus === "flinch") return
				}
				move.secondaries.push({
					chance: 10,
					volatileStatus: "flinch"
				})
			}
		},
		name: "あくしゅう",
		rating: 0.5,
		num: 1
	},
	"ねんちゃく": {
		onTakeItem(item, pokemon, source) {
			if (!this.activeMove) throw new Error("Battle.activeMove is null")
			if (!pokemon.hp || pokemon.item === "くっつきバリ") return
			if ((source && source !== pokemon) || this.activeMove.id === "はたきおとす") {
				this.add("-activate", pokemon, "ability: Sticky Hold")
				return false
			}
		},
		isBreakable: true,
		name: "ねんちゃく",
		rating: 1.5,
		num: 60
	},
	"よびみず": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Water") {
				if (!this.boost({ spa: 1 })) {
					this.add("-immune", target, "[from] ability: Storm Drain")
				}
				return null
			}
		},
		onAnyRedirectTarget(target, source, source2, move) {
			if (move.type !== "Water" || move.flags["pledgecombo"]) return
			const redirectTarget = ["randomNormal", "adjacentFoe"].includes(
				move.target
			)
				? "ノーマル"
				: move.target
			if (this.validTarget(this.effectState.target, source, redirectTarget)) {
				if (move.smartTarget) move.smartTarget = false
				if (this.effectState.target !== target) {
					this.add("-activate", this.effectState.target, "ability: Storm Drain")
				}
				return this.effectState.target
			}
		},
		isBreakable: true,
		name: "よびみず",
		rating: 3,
		num: 114
	},
	"がんじょうあご": {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["かみつく"]) {
				return this.chainModify(1.5)
			}
		},
		name: "がんじょうあご",
		rating: 3.5,
		num: 173
	},
	"がんじょう": {
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add("-immune", pokemon, "[from] ability: Sturdy")
				return null
			}
		},
		onDamagePriority: -30,
		onDamage(damage, target, source, effect) {
			if (
				target.hp === target.maxhp &&
				damage >= target.hp &&
				effect &&
				effect.effectType === "Move"
			) {
				this.add("-ability", target, "がんじょう")
				return target.hp - 1
			}
		},
		isBreakable: true,
		name: "がんじょう",
		rating: 3,
		num: 5
	},
	"きゅうばん": {
		onDragOutPriority: 1,
		onDragOut(pokemon) {
			this.add("-activate", pokemon, "ability: Suction Cups")
			return null
		},
		isBreakable: true,
		name: "きゅうばん",
		rating: 1,
		num: 21
	},
	"きょううん": {
		onModifyCritRatio(critRatio) {
			return critRatio + 1
		},
		name: "きょううん",
		rating: 1.5,
		num: 105
	},
	"かんろなミツ": {
		onStart(pokemon) {
			if (pokemon.syrupTriggered) return
			pokemon.syrupTriggered = true
			this.add("-ability", pokemon, "かんろなミツ")
			let activated = false
			for (const target of pokemon.adjacentFoes()) {
				if (!activated) {
					this.add("-ability", pokemon, "かんろなミツ", "boost")
					activated = true
				}
				if (target.volatiles["みがわり"]) {
					this.add("-immune", target)
				} else {
					this.boost({ evasion: -1 }, target, pokemon, null, true)
				}
			}
		},
		name: "かんろなミツ",
		rating: 1.5,
		num: 306
	},
	"そうだいしょう": {
		onStart(pokemon) {
			if (pokemon.side.totalFainted) {
				this.add("-activate", pokemon, "ability: Supreme Overlord")
				const fallen = Math.min(pokemon.side.totalFainted, 5)
				this.add("-start", pokemon, `fallen${fallen}`, "[silent]")
				this.effectState.fallen = fallen
			}
		},
		onEnd(pokemon) {
			this.add("-end", pokemon, `fallen${this.effectState.fallen}`, "[silent]")
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.effectState.fallen) {
				const powMod = [4096, 4506, 4915, 5325, 5734, 6144]
				this.debug(
					`Supreme Overlord boost: ${powMod[this.effectState.fallen]}/4096`
				)
				return this.chainModify([powMod[this.effectState.fallen], 4096])
			}
		},
		name: "そうだいしょう",
		rating: 4,
		num: 293
	},
	"サーフテール": {
		onModifySpe(spe) {
			if (this.field.isTerrain("エレキフィールド")) {
				return this.chainModify(2)
			}
		},
		name: "サーフテール",
		rating: 3,
		num: 207
	},
	"むしのしらせ": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Bug" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Swarm boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Bug" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Swarm boost")
				return this.chainModify(1.5)
			}
		},
		name: "むしのしらせ",
		rating: 2,
		num: 68
	},
	"スイートベール": {
		name: "スイートベール",
		onAllySetStatus(status, target, source, effect) {
			if (status.id === "slp") {
				this.debug("Sweet Veil interrupts sleep")
				const effectHolder = this.effectState.target
				this.add(
					"-block",
					target,
					"ability: Sweet Veil",
					"[of] " + effectHolder
				)
				return null
			}
		},
		onAllyTryAddVolatile(status, target) {
			if (status.id === "あくび") {
				this.debug("Sweet Veil blocking yawn")
				const effectHolder = this.effectState.target
				this.add(
					"-block",
					target,
					"ability: Sweet Veil",
					"[of] " + effectHolder
				)
				return null
			}
		},
		isBreakable: true,
		rating: 2,
		num: 175
	},
	"すいすい": {
		onModifySpe(spe, pokemon) {
			if (["あまごい", "はじまりのうみ"].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2)
			}
		},
		name: "すいすい",
		rating: 3,
		num: 33
	},
	"きょうせい": {
		onAllyAfterUseItem(item, pokemon) {
			if (pokemon.switchFlag) return
			const source = this.effectState.target
			const myItem = source.takeItem()
			if (!myItem) return
			if (
				!this.singleEvent(
					"TakeItem",
					myItem,
					source.itemState,
					pokemon,
					source,
					this.effect,
					myItem
				) ||
				!pokemon.setItem(myItem)
			) {
				source.item = myItem.id
				return
			}
			this.add(
				"-activate",
				source,
				"ability: Symbiosis",
				myItem,
				"[of] " + pokemon
			)
		},
		name: "きょうせい",
		rating: 0,
		num: 180
	},
	"シンクロ": {
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return
			if (effect && effect.id === "どくびし") return
			if (status.id === "slp" || status.id === "frz") return
			this.add("-activate", target, "ability: Synchronize")
			// Hack to make status-prevention abilities think Synchronize is a status move
			// and show messages when activating against it.
			source.trySetStatus(status, target, {
				status: status.id,
				id: "シンクロ"
			})
		},
		name: "シンクロ",
		rating: 2,
		num: 28
	},
	"わざわいのつるぎ": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "わざわいのつるぎ")
		},
		onAnyModifyDef(def, target, source, move) {
			const abilityHolder = this.effectState.target
			if (target.hasAbility("わざわいのつるぎ")) return
			if (!move.ruinedDef?.hasAbility("わざわいのつるぎ"))
				move.ruinedDef = abilityHolder
			if (move.ruinedDef !== abilityHolder) return
			this.debug("Sword of Ruin Def drop")
			return this.chainModify(0.75)
		},
		name: "わざわいのつるぎ",
		rating: 4.5,
		num: 285
	},
	"わざわいのおふだ": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "わざわいのおふだ")
		},
		onAnyModifyAtk(atk, source, target, move) {
			const abilityHolder = this.effectState.target
			if (source.hasAbility("わざわいのおふだ")) return
			if (!move.ruinedAtk) move.ruinedAtk = abilityHolder
			if (move.ruinedAtk !== abilityHolder) return
			this.debug("Tablets of Ruin Atk drop")
			return this.chainModify(0.75)
		},
		name: "わざわいのおふだ",
		rating: 4.5,
		num: 284
	},
	"ちどりあし": {
		onModifyAccuracyPriority: -1,
		onModifyAccuracy(accuracy, target) {
			if (typeof accuracy !== "number") return
			if (target?.volatiles["ねんりき"]) {
				this.debug("Tangled Feet - decreasing accuracy")
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "ちどりあし",
		rating: 1,
		num: 77
	},
	"カーリーヘアー": {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.add("-ability", target, "カーリーヘアー")
				this.boost({ spe: -1 }, source, target, null, true)
			}
		},
		name: "カーリーヘアー",
		rating: 2,
		num: 221
	},
	"テクニシャン": {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			const basePowerAfterMultiplier = this.modify(
				basePower,
				this.event.modifier
			)
			this.debug("Base Power: " + basePowerAfterMultiplier)
			if (basePowerAfterMultiplier <= 60) {
				this.debug("Technician boost")
				return this.chainModify(1.5)
			}
		},
		name: "テクニシャン",
		rating: 3.5,
		num: 101
	},
	"テレパシー": {
		onTryHit(target, source, move) {
			if (
				target !== source &&
				target.isAlly(source) &&
				move.category !== "Status"
			) {
				this.add("-activate", target, "ability: Telepathy")
				return null
			}
		},
		isBreakable: true,
		name: "テレパシー",
		rating: 0,
		num: 140
	},
	"テラボルテージ": {
		onStart(pokemon) {
			this.add("-ability", pokemon, "テラボルテージ")
		},
		onModifyMove(move) {
			move.ignoreAbility = true
		},
		name: "テラボルテージ",
		rating: 3,
		num: 164
	},
	"ねつこうかん": {
		onDamagingHit(damage, target, source, move) {
			if (move.type === "Fire") {
				this.boost({ atk: 1 })
			}
		},
		onUpdate(pokemon) {
			if (pokemon.status === "brn") {
				this.add("-activate", pokemon, "ability: Thermal Exchange")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "brn") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Thermal Exchange")
			}
			return false
		},
		name: "ねつこうかん",
		rating: 2.5,
		num: 270
	},
	"あついしぼう": {
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Ice" || move.type === "Fire") {
				this.debug("Thick Fat weaken")
				return this.chainModify(0.5)
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === "Ice" || move.type === "Fire") {
				this.debug("Thick Fat weaken")
				return this.chainModify(0.5)
			}
		},
		isBreakable: true,
		name: "あついしぼう",
		rating: 3.5,
		num: 47
	},
	"いろめがね": {
		onModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod < 0) {
				this.debug("Tinted Lens boost")
				return this.chainModify(2)
			}
		},
		name: "いろめがね",
		rating: 4,
		num: 110
	},
	"げきりゅう": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Water" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Torrent boost")
				return this.chainModify(1.5)
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Water" && attacker.hp <= attacker.maxhp / 3) {
				this.debug("Torrent boost")
				return this.chainModify(1.5)
			}
		},
		name: "げきりゅう",
		rating: 2,
		num: 67
	},
	"かたいツメ": {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags["contact"]) {
				return this.chainModify([5325, 4096])
			}
		},
		name: "かたいツメ",
		rating: 3.5,
		num: 181
	},
	"どくぼうそう": {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (
				(attacker.status === "psn" || attacker.status === "tox") &&
				move.category === "Physical"
			) {
				return this.chainModify(1.5)
			}
		},
		name: "どくぼうそう",
		rating: 3,
		num: 137
	},
	"どくのくさり": {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Toxic Chain's effect
			if (target.hasAbility("りんぷん") || target.hasItem("おんみつマント"))
				return

			if (this.randomChance(3, 10)) {
				target.trySetStatus("tox", source)
			}
		},
		name: "どくのくさり",
		rating: 4.5,
		num: 305
	},
	"どくげしょう": {
		onDamagingHit(damage, target, source, move) {
			const side = source.isAlly(target) ? source.side.foe : source.side
			const toxicSpikes = side.sideConditions["どくびし"]
			if (
				move.category === "Physical" &&
				(!toxicSpikes || toxicSpikes.layers < 2)
			) {
				this.add("-activate", target, "ability: Toxic Debris")
				side.addSideCondition("どくびし", target)
			}
		},
		name: "どくげしょう",
		rating: 3.5,
		num: 295
	},
	"トレース": {
		onStart(pokemon) {
			// n.b. only affects Hackmons
			// interaction with No Ability is complicated: https://www.smogon.com/forums/threads/pokemon-sun-moon-battle-mechanics-research.3586701/page-76#post-7790209
			if (
				pokemon
					.adjacentFoes()
					.some(foeActive => foeActive.ability === "noability")
			) {
				this.effectState.gaveUp = true
			}
			// interaction with Ability Shield is similar to No Ability
			if (pokemon.hasItem("とくせいガード")) {
				this.add("-block", pokemon, "item: Ability Shield")
				this.effectState.gaveUp = true
			}
		},
		onUpdate(pokemon) {
			if (!pokemon.isStarted || this.effectState.gaveUp) return

			const additionalBannedAbilities = [
				// Zen Mode included here for compatability with Gen 5-6
				"noability",
				"しれいとう",
				"フラワーギフト",
				"てんきや",
				"はらぺこスイッチ",
				"イリュージョン",
				"かわりもの",
				"かがくへんかガス",
				"かがくのちから",
				"レシーバー",
				"トレース",
				"ダルマモード"
			]
			const possibleTargets = pokemon
				.adjacentFoes()
				.filter(
					target =>
						!target.getAbility().isPermanent &&
						!additionalBannedAbilities.includes(target.ability)
				)
			if (!possibleTargets.length) return

			const target = this.sample(possibleTargets)
			const ability = target.getAbility()
			if (pokemon.setAbility(ability)) {
				this.add(
					"-ability",
					pokemon,
					ability,
					"[from] ability: Trace",
					"[of] " + target
				)
			}
		},
		name: "トレース",
		rating: 2.5,
		num: 36
	},
	"トランジスタ": {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Electric") {
				this.debug("Transistor boost")
				return this.chainModify([5325, 4096])
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Electric") {
				this.debug("Transistor boost")
				return this.chainModify([5325, 4096])
			}
		},
		name: "トランジスタ",
		rating: 3.5,
		num: 262
	},
	"ヒーリングシフト": {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.flags["heal"]) return priority + 3
		},
		name: "ヒーリングシフト",
		rating: 3.5,
		num: 205
	},
	"なまけ": {
		onStart(pokemon) {
			pokemon.removeVolatile("なまけ")
			if (
				pokemon.activeTurns &&
				(pokemon.moveThisTurnResult !== undefined ||
					!this.queue.willMove(pokemon))
			) {
				pokemon.addVolatile("なまけ")
			}
		},
		onBeforeMovePriority: 9,
		onBeforeMove(pokemon) {
			if (pokemon.removeVolatile("なまけ")) {
				this.add("cant", pokemon, "ability: Truant")
				return false
			}
			pokemon.addVolatile("なまけ")
		},
		condition: {},
		name: "なまけ",
		rating: -1,
		num: 54
	},
	"ターボブレイズ": {
		onStart(pokemon) {
			this.add("-ability", pokemon, "ターボブレイズ")
		},
		onModifyMove(move) {
			move.ignoreAbility = true
		},
		name: "ターボブレイズ",
		rating: 3,
		num: 163
	},
	"てんねん": {
		name: "てんねん",
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target
			if (unawareUser === pokemon) return
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts["def"] = 0
				boosts["spd"] = 0
				boosts["evasion"] = 0
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts["atk"] = 0
				boosts["def"] = 0
				boosts["spa"] = 0
				boosts["accuracy"] = 0
			}
		},
		isBreakable: true,
		rating: 4,
		num: 109
	},
	"かるわざ": {
		onAfterUseItem(item, pokemon) {
			if (pokemon !== this.effectState.target) return
			pokemon.addVolatile("かるわざ")
		},
		onTakeItem(item, pokemon) {
			pokemon.addVolatile("かるわざ")
		},
		onEnd(pokemon) {
			pokemon.removeVolatile("かるわざ")
		},
		condition: {
			onModifySpe(spe, pokemon) {
				if (!pokemon.item && !pokemon.ignoringAbility()) {
					return this.chainModify(2)
				}
			}
		},
		name: "かるわざ",
		rating: 3.5,
		num: 84
	},
	"きんちょうかん": {
		onPreStart(pokemon) {
			this.add("-ability", pokemon, "きんちょうかん")
			this.effectState.unnerved = true
		},
		onStart(pokemon) {
			if (this.effectState.unnerved) return
			this.add("-ability", pokemon, "きんちょうかん")
			this.effectState.unnerved = true
		},
		onEnd() {
			this.effectState.unnerved = false
		},
		onFoeTryEatItem() {
			return !this.effectState.unnerved
		},
		name: "きんちょうかん",
		rating: 1,
		num: 127
	},
	"ふかしのこぶし": {
		onModifyMove(move) {
			if (move.flags["contact"]) delete move.flags["まもる"]
		},
		name: "ふかしのこぶし",
		rating: 2,
		num: 260
	},
	"わざわいのうつわ": {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return
			this.add("-ability", pokemon, "わざわいのうつわ")
		},
		onAnyModifySpA(spa, source, target, move) {
			const abilityHolder = this.effectState.target
			if (source.hasAbility("わざわいのうつわ")) return
			if (!move.ruinedSpA) move.ruinedSpA = abilityHolder
			if (move.ruinedSpA !== abilityHolder) return
			this.debug("Vessel of Ruin SpA drop")
			return this.chainModify(0.75)
		},
		name: "わざわいのうつわ",
		rating: 4.5,
		num: 284
	},
	"しょうりのほし": {
		onAnyModifyAccuracyPriority: -1,
		onAnyModifyAccuracy(accuracy, target, source) {
			if (
				source.isAlly(this.effectState.target) &&
				typeof accuracy === "number"
			) {
				return this.chainModify([4506, 4096])
			}
		},
		name: "しょうりのほし",
		rating: 2,
		num: 162
	},
	"やるき": {
		onUpdate(pokemon) {
			if (pokemon.status === "slp") {
				this.add("-activate", pokemon, "ability: Vital Spirit")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "slp") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Vital Spirit")
			}
			return false
		},
		onTryAddVolatile(status, target) {
			if (status.id === "あくび") {
				this.add("-immune", target, "[from] ability: Vital Spirit")
				return null
			}
		},
		isBreakable: true,
		name: "やるき",
		rating: 1.5,
		num: 72
	},
	"ちくでん": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Electric") {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add("-immune", target, "[from] ability: Volt Absorb")
				}
				return null
			}
		},
		isBreakable: true,
		name: "ちくでん",
		rating: 3.5,
		num: 10
	},
	"さまようたましい": {
		onDamagingHit(damage, target, source, move) {
			const additionalBannedAbilities = [
				"しれいとう",
				"はらぺこスイッチ",
				"イリュージョン",
				"かがくへんかガス",
				"ふしぎなまもり"
			]
			if (
				source.getAbility().isPermanent ||
				additionalBannedAbilities.includes(source.ability) ||
				target.volatiles["dynamax"]
			) {
				return
			}

			if (this.checkMoveMakesContact(move, source, target)) {
				const targetCanBeSet = this.runEvent(
					"SetAbility",
					target,
					source,
					this.effect,
					source.ability
				)
				if (!targetCanBeSet) return targetCanBeSet
				const sourceAbility = source.setAbility("さまようたましい", target)
				if (!sourceAbility) return
				if (target.isAlly(source)) {
					this.add("-activate", target, "スキルスワップ", "", "", "[of] " + source)
				} else {
					this.add(
						"-activate",
						target,
						"ability: Wandering Spirit",
						this.dex.abilities.get(sourceAbility).name,
						"さまようたましい",
						"[of] " + source
					)
				}
				target.setAbility(sourceAbility)
			}
		},
		name: "さまようたましい",
		rating: 2.5,
		num: 254
	},
	"ちょすい": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Water") {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add("-immune", target, "[from] ability: Water Absorb")
				}
				return null
			}
		},
		isBreakable: true,
		name: "ちょすい",
		rating: 3.5,
		num: 11
	},
	"すいほう": {
		onSourceModifyAtkPriority: 5,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Fire") {
				return this.chainModify(0.5)
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === "Fire") {
				return this.chainModify(0.5)
			}
		},
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === "Water") {
				return this.chainModify(2)
			}
		},
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === "Water") {
				return this.chainModify(2)
			}
		},
		onUpdate(pokemon) {
			if (pokemon.status === "brn") {
				this.add("-activate", pokemon, "ability: Water Bubble")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "brn") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Water Bubble")
			}
			return false
		},
		isBreakable: true,
		name: "すいほう",
		rating: 4.5,
		num: 199
	},
	"みずがため": {
		onDamagingHit(damage, target, source, move) {
			if (move.type === "Water") {
				this.boost({ def: 2 })
			}
		},
		name: "みずがため",
		rating: 1.5,
		num: 195
	},
	"みずのベール": {
		onUpdate(pokemon) {
			if (pokemon.status === "brn") {
				this.add("-activate", pokemon, "ability: Water Veil")
				pokemon.cureStatus()
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== "brn") return
			if (effect?.status) {
				this.add("-immune", target, "[from] ability: Water Veil")
			}
			return false
		},
		isBreakable: true,
		name: "みずのベール",
		rating: 2,
		num: 41
	},
	"くだけるよろい": {
		onDamagingHit(damage, target, source, move) {
			if (move.category === "Physical") {
				this.boost({ def: -1, spe: 2 }, target, target)
			}
		},
		name: "くだけるよろい",
		rating: 1,
		num: 133
	},
	"こんがりボディ": {
		onTryHit(target, source, move) {
			if (target !== source && move.type === "Fire") {
				if (!this.boost({ def: 2 })) {
					this.add("-immune", target, "[from] ability: Well-Baked Body")
				}
				return null
			}
		},
		isBreakable: true,
		name: "こんがりボディ",
		rating: 3.5,
		num: 273
	},
	"しろいけむり": {
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return
			let showMsg = false
			let i
			for (i in boost) {
				if (boost[i] < 0) {
					delete boost[i]
					showMsg = true
				}
			}
			if (showMsg && !effect.secondaries && effect.id !== "octolock") {
				this.add(
					"-fail",
					target,
					"unboost",
					"[from] ability: White Smoke",
					"[of] " + target
				)
			}
		},
		isBreakable: true,
		name: "しろいけむり",
		rating: 2,
		num: 73
	},
	"にげごし": {
		onEmergencyExit(target) {
			if (
				!this.canSwitch(target.side) ||
				target.forceSwitchFlag ||
				target.switchFlag
			)
				return
			for (const side of this.sides) {
				for (const active of side.active) {
					active.switchFlag = false
				}
			}
			target.switchFlag = true
			this.add("-activate", target, "ability: Wimp Out")
		},
		name: "にげごし",
		rating: 1,
		num: 193
	},
	"ふうりょくでんき": {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (move.flags["wind"]) {
				target.addVolatile("じゅうでん")
			}
		},
		onAllySideConditionStart(target, source, sideCondition) {
			const pokemon = this.effectState.target
			if (sideCondition.id === "おいかぜ") {
				pokemon.addVolatile("じゅうでん")
			}
		},
		name: "ふうりょくでんき",
		rating: 1,
		num: 277
	},
	"かぜのり": {
		onStart(pokemon) {
			if (pokemon.side.sideConditions["おいかぜ"]) {
				this.boost({ atk: 1 }, pokemon, pokemon)
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.flags["wind"]) {
				if (!this.boost({ atk: 1 }, target, target)) {
					this.add("-immune", target, "[from] ability: Wind Rider")
				}
				return null
			}
		},
		onAllySideConditionStart(target, source, sideCondition) {
			const pokemon = this.effectState.target
			if (sideCondition.id === "おいかぜ") {
				this.boost({ atk: 1 }, pokemon, pokemon)
			}
		},
		isBreakable: true,
		name: "かぜのり",
		rating: 3.5,
		// We do not want Brambleghast to get Infiltrator in Randbats
		num: 274
	},
	"ふしぎなまもり": {
		onTryHit(target, source, move) {
			if (
				target === source ||
				move.category === "Status" ||
				move.type === "???" ||
				move.id === "わるあがき"
			)
				return
			if (move.id === "skydrop" && !source.volatiles["skydrop"]) return
			this.debug("Wonder Guard immunity: " + move.id)
			if (target.runEffectiveness(move) <= 0) {
				if (move.smartTarget) {
					move.smartTarget = false
				} else {
					this.add("-immune", target, "[from] ability: Wonder Guard")
				}
				return null
			}
		},
		isBreakable: true,
		name: "ふしぎなまもり",
		rating: 5,
		num: 25
	},
	"ミラクルスキン": {
		onModifyAccuracyPriority: 10,
		onModifyAccuracy(accuracy, target, source, move) {
			if (move.category === "Status" && typeof accuracy === "number") {
				this.debug("Wonder Skin - setting accuracy to 50")
				return 50
			}
		},
		isBreakable: true,
		name: "ミラクルスキン",
		rating: 2,
		num: 147
	},
	"ダルマモード": {
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== "Darmanitan" ||
				pokemon.transformed
			) {
				return
			}
			if (
				pokemon.hp <= pokemon.maxhp / 2 &&
				!["Zen", "Galar-Zen"].includes(pokemon.species.forme)
			) {
				pokemon.addVolatile("ダルマモード")
			} else if (
				pokemon.hp > pokemon.maxhp / 2 &&
				["Zen", "Galar-Zen"].includes(pokemon.species.forme)
			) {
				pokemon.addVolatile("ダルマモード") // in case of base Darmanitan-Zen
				pokemon.removeVolatile("ダルマモード")
			}
		},
		onEnd(pokemon) {
			if (!pokemon.volatiles["ダルマモード"] || !pokemon.hp) return
			pokemon.transformed = false
			delete pokemon.volatiles["ダルマモード"]
			if (
				pokemon.species.baseSpecies === "Darmanitan" &&
				pokemon.species.battleOnly
			) {
				pokemon.formeChange(
					pokemon.species.battleOnly,
					this.effect,
					false,
					"[silent]"
				)
			}
		},
		condition: {
			onStart(pokemon) {
				if (!pokemon.species.name.includes("Galar")) {
					if (pokemon.species.id !== "darmanitanzen")
						pokemon.formeChange("Darmanitan-Zen")
				} else {
					if (pokemon.species.id !== "darmanitangalarzen")
						pokemon.formeChange("Darmanitan-Galar-Zen")
				}
			},
			onEnd(pokemon) {
				if (["Zen", "Galar-Zen"].includes(pokemon.species.forme)) {
					pokemon.formeChange(pokemon.species.battleOnly)
				}
			}
		},
		isPermanent: true,
		name: "ダルマモード",
		rating: 0,
		num: 161
	},
	"マイティチェンジ": {
		onSwitchOut(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== "Palafin" || pokemon.transformed)
				return
			if (pokemon.species.forme !== "Hero") {
				pokemon.formeChange("Palafin-Hero", this.effect, true)
			}
		},
		onSwitchIn() {
			this.effectState.switchingIn = true
		},
		onStart(pokemon) {
			if (!this.effectState.switchingIn) return
			this.effectState.switchingIn = false
			if (pokemon.baseSpecies.baseSpecies !== "Palafin" || pokemon.transformed)
				return
			if (
				!this.effectState.heroMessageDisplayed &&
				pokemon.species.forme === "Hero"
			) {
				this.add("-activate", pokemon, "ability: Zero to Hero")
				this.effectState.heroMessageDisplayed = true
			}
		},
		isPermanent: true,
		name: "マイティチェンジ",
		rating: 5,
		num: 278
	},

}
