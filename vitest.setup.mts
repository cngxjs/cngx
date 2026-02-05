import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Jest-DOM Matchers manuell erweitern (ohne vitest import)
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// TestBed initialisieren
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);