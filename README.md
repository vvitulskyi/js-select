# Javascript Select

### Basic interface

```JS
const select = new Select({
    selectWrapper: document.querySelector(".js-names-select"),
    fetchUrl: "https://parseapi.back4app.com/classes/Complete_List_Names",
    defaultSearchParams: {
      limit: 10000,
      order: "Name",
      excludeKeys: "Genre",
    },
    searchParameter: "Name",
    onChange: (option) => {
      console.log(option);
    },
  });
  select.init();
```
