import { it } from 'vitest';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

import { describeCommitContract, type CommitContractHost } from './__test-helpers/commit-contract';

const FLAT = { inputs: '[options]="options"', optionSelector: '[cngxOption]' } as const;

const SELECT: CommitContractHost = {
  ...FLAT,
  name: 'CngxSelect',
  component: CngxSelect,
  selector: 'cngx-select',
  model: 'value',
  kinds: ['select', 'clear'],
};

const TYPEAHEAD: CommitContractHost = {
  ...FLAT,
  name: 'CngxTypeahead',
  component: CngxTypeahead,
  selector: 'cngx-typeahead',
  model: 'value',
  kinds: ['select', 'clear'],
  displayWith: true,
};

const ACTION_SELECT: CommitContractHost = {
  ...FLAT,
  name: 'CngxActionSelect',
  component: CngxActionSelect,
  selector: 'cngx-action-select',
  model: 'value',
  kinds: ['select', 'clear'],
  displayWith: true,
};

const SELECT_SHELL: CommitContractHost = {
  name: 'CngxSelectShell',
  component: CngxSelectShell,
  selector: 'cngx-select-shell',
  inputs: '',
  content: `
    <cngx-option [value]="'red'">Red</cngx-option>
    <cngx-option [value]="'green'">Green</cngx-option>
    <cngx-option [value]="'blue'">Blue</cngx-option>
  `,
  contentImports: [CngxSelectOption],
  optionSelector: 'cngx-option',
  model: 'value',
  kinds: ['select', 'clear'],
};

const MULTI_SELECT: CommitContractHost = {
  ...FLAT,
  name: 'CngxMultiSelect',
  component: CngxMultiSelect,
  selector: 'cngx-multi-select',
  model: 'values',
  kinds: ['toggle', 'clear'],
};

const COMBOBOX: CommitContractHost = {
  ...FLAT,
  name: 'CngxCombobox',
  component: CngxCombobox,
  selector: 'cngx-combobox',
  model: 'values',
  kinds: ['toggle', 'clear'],
};

const ACTION_MULTI_SELECT: CommitContractHost = {
  ...FLAT,
  name: 'CngxActionMultiSelect',
  component: CngxActionMultiSelect,
  selector: 'cngx-action-multi-select',
  model: 'values',
  kinds: ['toggle', 'clear'],
};

const REORDERABLE: CommitContractHost = {
  ...FLAT,
  name: 'CngxReorderableMultiSelect',
  component: CngxReorderableMultiSelect,
  selector: 'cngx-reorderable-multi-select',
  model: 'values',
  kinds: ['toggle', 'clear', 'reorder'],
};

const TREE_SELECT: CommitContractHost = {
  name: 'CngxTreeSelect',
  component: CngxTreeSelect,
  selector: 'cngx-tree-select',
  inputs: '[nodes]="nodes" [nodeIdFn]="idFn" [labelFn]="labelFn"',
  optionSelector: '[role="treeitem"]',
  model: 'values',
  kinds: ['tree', 'clear'],
};

describeCommitContract(SELECT, (c) => {
  it('A3/B2: field null reads as empty and never reaches displayWith', c.fieldNullIsEmpty);
  it("A3/B2: field '' reads as empty and never reaches displayWith", c.fieldEmptyStringIsEmpty);
  it('A1/A11: Retry after a failed select replays the select', c.retrySelect);
  it('A15: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('A6: a letter key on the closed trigger calls commitAction', c.closedTypeaheadCommits);
  it('A15: clear while a commit is pending wins over that commit', c.clearWhilePendingWins);
  it('A15: clear after a failed commit clears the commit error', c.clearClearsCommitError);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(TYPEAHEAD, (c) => {
  it('A3/B2: field null reads as empty and never reaches displayWith', c.fieldNullIsEmpty);
  it("A3/B2: field '' reads as empty and never reaches displayWith", c.fieldEmptyStringIsEmpty);
  it('A1/A11: Retry after a failed select replays the select', c.retrySelect);
  it('A15: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('A15: clear while a commit is pending wins over that commit', c.clearWhilePendingWins);
  it('A15: clear after a failed commit clears the commit error', c.clearClearsCommitError);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(ACTION_SELECT, (c) => {
  it('A3/B2: field null reads as empty and never reaches displayWith', c.fieldNullIsEmpty);
  it("A3/B2: field '' reads as empty and never reaches displayWith", c.fieldEmptyStringIsEmpty);
  it('A1/A11: Retry after a failed select replays the select', c.retrySelect);
  it('A15: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('A15: clear while a commit is pending wins over that commit', c.clearWhilePendingWins);
  it('A15: clear after a failed commit clears the commit error', c.clearClearsCommitError);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(SELECT_SHELL, (c) => {
  it('A3/B2: field null reads as empty and never reaches displayWith', c.fieldNullIsEmpty);
  it("A3/B2: field '' reads as empty and never reaches displayWith", c.fieldEmptyStringIsEmpty);
  it('A1/A11: Retry after a failed select replays the select', c.retrySelect);
  it('A15: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('A6: a letter key on the closed trigger calls commitAction', c.closedTypeaheadCommits);
  it('A15: clear while a commit is pending wins over that commit', c.clearWhilePendingWins);
  it('A15: clear after a failed commit clears the commit error', c.clearClearsCommitError);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(MULTI_SELECT, (c) => {
  it('A1/A11: Retry after a failed toggle replays the toggle', c.retryToggle);
  it('A1/A11: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('B11: a provided CNGX_ARRAY_COMMIT_HANDLER_FACTORY is used', c.arrayHandlerFactoryUsed);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(COMBOBOX, (c) => {
  it('A1/A11: Retry after a failed toggle replays the toggle', c.retryToggle);
  it('A1/A11: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('B11: a provided CNGX_ARRAY_COMMIT_HANDLER_FACTORY is used', c.arrayHandlerFactoryUsed);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(ACTION_MULTI_SELECT, (c) => {
  it('A1/A11: Retry after a failed toggle replays the toggle', c.retryToggle);
  it('A1/A11: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('B11: a provided CNGX_ARRAY_COMMIT_HANDLER_FACTORY is used', c.arrayHandlerFactoryUsed);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(REORDERABLE, (c) => {
  it('A1/A11: Retry after a failed toggle replays the toggle', c.retryToggle);
  it('A1/A11: Retry after a failed clear replays the clear', c.retryClear);
  it('A1/A11: Retry after a failed reorder replays the reorder', c.retryReorder);
  it(
    'A1/A11: Retry after a failed reorder never replays an earlier clear',
    c.retryReorderNotStaleClear,
  );
  it(
    'B3/A12: a failed reorder is announced assertively after the rollback',
    c.reorderFailureAnnounced,
  );
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('B11: a provided CNGX_ARRAY_COMMIT_HANDLER_FACTORY is used', c.arrayHandlerFactoryUsed);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});

describeCommitContract(TREE_SELECT, (c) => {
  it('A1/A11: Retry after a failed tree toggle replays the tree toggle', c.retryTree);
  it('A1/A11: Retry after a failed clear replays the clear', c.retryClear);
  it('A18: an action returning EMPTY settles as error and unblocks closing', c.emptyActionSettles);
  it('A13: the soft policy never speaks the cleared phrase', c.softPolicyNeverSpeaksCleared);
  it('B11: a provided CNGX_ARRAY_COMMIT_HANDLER_FACTORY is used', c.arrayHandlerFactoryUsed);
  it(
    'A14: a second commit while pending rolls back to the confirmed value',
    c.secondCommitRollsBackToConfirmed,
  );
});
