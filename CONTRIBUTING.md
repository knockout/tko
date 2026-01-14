## Contributing to Knockout (TKO)

🎉 Thanks for taking the time to contribute!

When thinking of contributing, the most important thing is to use your best judgement.

Knockout is maintained by volunteers whose time is limited, so the more you can do up front, the faster something will get analyzed and fixed.

This project adheres to the [Contributor Covenant code of conduct](/CODE_OF_CONDUCT.md). By participating, you are agreeing to uphold this code. 

## How to Contribute

Have a look on [StackOverflow](https://stackoverflow.com), in the source, on gitter.im, and in the documentation, to see if someone else has already reported the issue.

Second, include as many details as possible. Good details likely include:

1. Use a clear, descriptive **title**.
2. Note the platform, browser, and library **versions**.
3. Describe the exact **steps** to reproduce the problem – not necessarily just what you did but how you did it.
4. Provide a specific **example**, preferably on a Javascript sandbox like jsFiddle, jsBin, or CodePen.
5. Describe the **problem observed**.
6. Explain the **expected results**.

If the issue is an enhancement, consider also including:

1. Explain why it would be **useful**.
2. List **other applications** that have the enhancement.

## Documentation

All TKO documentation lives in `tko.io/src/docs/`.

To contribute documentation:

1. Edit files in `tko.io/src/docs/[category]/` where category is:
   - `bindings/` - All binding handlers
   - `observables/` - Observable and observable array docs
   - `computed/` - Computed observable docs
   - `components/` - Component system docs
   - `binding-context/` - Binding context and custom bindings
   - `advanced/` - Advanced topics (lifecycle, providers, parsers)

2. Each file requires frontmatter:
   ```yaml
   ---
   layout: base.njk
   title: Page Title
   ---
   ```

3. Test locally:
   ```bash
   cd tko.io
   bun run dev
   ```
   Then visit http://localhost:8080

4. Submit a PR with your changes

The documentation site is automatically deployed when changes are merged to main.

## Pull Requests

A good pull request might include:

1. Thoughtfully worded, well-structured tests in the `spec/` folder that pass for all supported browsers
2. Inline documentation
3. Commit messages that follow the style (from [Atom](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)):

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally
* When only changing documentation, include `[ci skip]` in the commit description
* Consider starting the commit message with an applicable emoji:
    * :art: `:art:` when improving the format/structure of the code
    * :racehorse: `:racehorse:` when improving performance
    * :non-potable_water: `:non-potable_water:` when plugging memory leaks
    * :memo: `:memo:` when writing docs
    * :penguin: `:penguin:` when fixing something on Linux
    * :apple: `:apple:` when fixing something on Mac OS
    * :checkered_flag: `:checkered_flag:` when fixing something on Windows
    * :bug: `:bug:` when fixing a bug
    * :fire: `:fire:` when removing code or files
    * :green_heart: `:green_heart:` when fixing the CI build
    * :white_check_mark: `:white_check_mark:` when adding tests
    * :lock: `:lock:` when dealing with security
    * :arrow_up: `:arrow_up:` when upgrading dependencies
    * :arrow_down: `:arrow_down:` when downgrading dependencies
    * :shirt: `:shirt:` when removing linter warnings

## Style

Do your best to mimic the local style.
