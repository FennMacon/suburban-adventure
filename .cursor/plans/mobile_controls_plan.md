# Mobile Controls Plan

## Overview

Design and implement a dedicated mobile controls layout for Suburban Adventure. Defer until after desktop layouts are solid. This plan captures the current state, known issues, and options to revisit later.

---

## Current State

**Mobile detection:** [controls.js](controls.js) line 25  
`isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)`

**Existing mobile UI elements** (all in [controls.js](controls.js) `setupTouchControls`):

| Element | Position | Size | Z-index |
|---------|----------|------|---------|
| Movement joystick | `bottom: 20px; left: 20px` | 80x80px | 1000 |
| Look joystick | `bottom: 20px; right: 20px` | 80x80px | 1000 |
| Run/Action button | `bottom: 120px; right: 20px` | 80x80px | 1000 |
| Phone toggle button | `bottom: 20px; right: 20px` | 32x32px (→ 48x48) | 1500 |

**Known conflict:**
- Phone button and look joystick both occupy bottom-right; they fully overlap.
- Phone is smaller and buried under the joystick, making it effectively untappable on mobile.

---

## Options (When Implementing Later)

**Phone position ideas:**
- Top-right corner (avoids all current joysticks)
- Above the look joystick (`bottom: 110px; right: 20px`)
- Left side, between movement joystick and action button
- Separate "menu" or "phone" zone in a dedicated mobile HUD layout

**Broader mobile considerations:**
- Redesign entire mobile HUD (joysticks, buttons, phone) as a cohesive layout
- Touch target sizes (Apple HIG: 44pt minimum)
- Safe areas for notched devices
- Potentially different control schemes (tap-to-move, virtual D-pad, etc.)

---

## Deferred

No implementation in this phase. Revisit after desktop layouts and phone UI improvements are complete.
