<p align="center">
  <h1 align="center">@devlsh/embed-demo</h1>
  <p align="center">Interactive demonstration of iFrame messaging.</p>
</p>

<br />

The demo connects a parent page to two isolated iframe children through `@devlsh/embed` for async requests, sync posts, errors, and tips.

## Try It

Open the [interactive demo](https://embed.devlsh.com).

Use the controls to change the demonstration:

- **Click for Async:** Send `{ dummy: 'lol 123' }` to its parent. The parent shows the payload and a five-second countdown. The child shows `Async result: Hello world!`.
- **Click for Sync:** Post a random integer from 1 to 100000. Only its parent shows that number.
- **Click for Error:** Request an error response. The parent rejects the request with `Some random error`. The child shows `Error result: Error: Some random error`.
- **Trigger Random Tip:** Send a tip from the first parent channel. Its child shows `Penguins are cool 1`.
- **Trigger Random Tip 2:** Send a tip from the second parent channel. Its child shows `Penguins are cool 2`.

---

> [devlsh.com](https://devlsh.com) &nbsp;&middot;&nbsp;
> GitHub: [@devlsh](https://github.com/devlsh) &nbsp;&middot;&nbsp;
> X: [@itsdevlsh](https://x.com/itsdevlsh)
