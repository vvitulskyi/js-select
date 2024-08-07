class Select {
  constructor({
    selectWrapper,
    fetchUrl,
    fetchOptions,
    defaultSearchParams,
    searchParameter,
    displayedOptions = 100,
    onChange = (option) => console.log(option),
    formattingOptions = (o) => o,
  }) {
    this.select = selectWrapper;
    this.fetchUrl = fetchUrl;
    this.fetchOptions = fetchOptions;
    this.defaultSearchParams = defaultSearchParams;
    this.searchParameter = searchParameter;
    this.displayedOptions = displayedOptions;
    this.onChange = onChange;
    this.formattingOptions = formattingOptions;

    this.loading = false;
    this.reachedLimit = false;
    this.selectedOption = null;
  }

  #oprionsWrapperSelectorHigh = ".js-select-options-wrapper";
  #oprionsWrapperSelector = ".js-select-options";
  #optionsHelperTop = ".js-select-options-top";
  #optionsHelperBot = ".js-select-options-bottom";
  #inputSelector = ".js-search-input-wrapper input[type=text]";
  #chevronSelector = ".js-chevron";

  #lastScrollTop = 0;
  #skip = 0;
  #optionHeight = 0;
  #lastWhere = "";
  #searchTimeout = null;
  #scrollTimeout = null;
  #loadedOptions = [];

  get value() {
    return this.selectedOption;
  }

  init = async () => {
    await this.#fetchData(this.defaultSearchParams);
    this.addEvents();
    this.#showingOptions();
  };

  addEvents = () => {
    this.select.addEventListener("keydown", this.#keyDownHandler);

    this.select.addEventListener("focusin", this.#focusInHandler);
    this.select.addEventListener("focusout", this.#focusOutHandler);

    this.select
      .querySelector(".js-chevron")
      .addEventListener("click", this.#toggleList);

    this.select
      .querySelector(this.#inputSelector)
      .addEventListener("input", this.#changeInputHandler);

    this.select
      .querySelector(this.#oprionsWrapperSelectorHigh)
      .addEventListener("scroll", this.#scrollOptionsListHandler);

    this.select
      .querySelector(this.#oprionsWrapperSelector)
      .addEventListener("click", this.#selectOptionHandler);
  };

  removeEvents = () => {
    this.select.removeEventListener("keydown", this.#keyDownHandler);

    this.select.removeEventListener("focusin", this.#focusInHandler);
    this.select.removeEventListener("focusout", this.#focusOutHandler);

    this.select
      .querySelector(".js-chevron")
      .removeEventListener("click", this.#toggleList);

    this.select
      .querySelector(this.#inputSelector)
      .removeEventListener("input", this.#changeInputHandler);

    this.select
      .querySelector(this.#oprionsWrapperSelectorHigh)
      .removeEventListener("scroll", this.#scrollOptionsListHandler);

    this.select
      .querySelector(this.#oprionsWrapperSelector)
      .removeEventListener("click", this.#selectOptionHandler);
  };

  // Handlers
  #selectOptionHandler = (e) => {
    if (e.target.tagName == "LI") {
      this.#setSelectedOption({
        label: e.target.textContent,
        value: e.target.dataset.value,
      });

      const selected = this.select.querySelector(
        `${this.#oprionsWrapperSelector} .selected`
      );
      if (selected) {
        selected.classList.remove("selected");
      }

      e.target.classList.add("selected");
      this.#hideList();
    }
  };

  #keyDownHandler = (e) => {
    switch (e.keyCode) {
      case 38:
        e.preventDefault();
        if (e.target.tagName == "INPUT") {
          return;
        }
        this.#nextFocus(e.target.previousElementSibling, e);
        break;
      case 40:
        e.preventDefault();
        if (e.target.tagName == "INPUT") {
          this.select
            .querySelector(this.#oprionsWrapperSelector)
            .children[0].focus();
          return;
        }
        this.#nextFocus(e.target.nextElementSibling, e);
        break;
      case 13:
        e.preventDefault();
        this.#selectOptionHandler(e);
      default:
        return;
    }
  };

  #focusInHandler = (e) => {
    if (e.target != this.select.querySelector(this.#chevronSelector)) {
      this.#showList();
    }
  };

  #focusOutHandler = (e) => {
    if (!this.select.contains(e.relatedTarget)) {
      this.#hideList();
    }
    this.#setInputValue();
  };

  #changeInputHandler = () => {
    this.#skip = 0;
    this.reachedLimit = false;
    clearTimeout(this.#searchTimeout);
    this.#searchTimeout = setTimeout(() => {
      const whereParam = this.#getWhereParam();
      this.#fetchData(
        {
          ...this.defaultSearchParams,
          ...(whereParam ? { where: whereParam } : null),
        },
        true
      );
    }, 500);
  };

  #scrollOptionsListHandler = (e) => {
    if (this.#isScrolledToEnd() && !this.loading) {
      this.#skip += this.defaultSearchParams.limit;
      const whereParam = this.#getWhereParam();
      this.#fetchData({
        ...this.defaultSearchParams,
        skip: this.#skip,
        ...(whereParam ? { where: whereParam } : null),
      });
    }

    if (!this.#scrollTimeout) {
      this.#scrollTimeout = setTimeout(() => {
        this.#showingOptions();
        clearTimeout(this.#scrollTimeout);
        this.#scrollTimeout = null;
      }, 1000);
    }
  };

  // Other methods
  #setSelectedOption = (selectedOption) => {
    this.selectedOption = selectedOption;
    this.onChange(selectedOption);
    this.#setInputValue();
  };

  #setInputValue = () => {
    if (
      this.selectedOption &&
      this.select.querySelector(this.#inputSelector).value !=
        this.selectedOption.label
    ) {
      this.select.querySelector(this.#inputSelector).value =
        this.selectedOption.label;
    }
  };

  #isScrolledToEnd = () => {
    const list = this.select.querySelector(this.#oprionsWrapperSelectorHigh);
    return (
      list.scrollTop + this.#optionHeight * (this.displayedOptions / 2) >
        list.scrollHeight && !this.reachedLimit
    );
  };

  #nextFocus = (next, e) => {
    if (!next) {
      this.select.querySelector(this.#inputSelector).focus();
      return;
    }
    next.focus();
  };

  #getWhereParam() {
    const inputVal = this.select.querySelector(this.#inputSelector).value;
    if (!inputVal) {
      return null;
    }
    return JSON.stringify({
      [this.searchParameter]: {
        $regex: inputVal,
      },
    });
  }

  #showList = () => {
    this.select.classList.add("opened");
  };

  #hideList = () => {
    // this.select.classList.remove("opened");
  };

  #toggleList = () => {
    this.select.classList.toggle("opened");
    this.#setInputValue();
  };

  #startLoading = () => {
    this.loading = true;
    this.select.classList.add("loading");
  };

  #endLoading = () => {
    this.loading = false;
    this.select.classList.remove("loading");
  };

  // Data source
  #fetchData = async (searchParams, reset = false) => {
    if (this.reachedLimit) {
      return;
    }

    if (this.#lastWhere && this.#lastWhere == searchParams.where) {
      return;
    }

    this.#startLoading();
    const fetchUrl = new URL(this.fetchUrl);

    Object.keys(searchParams).forEach((key) => {
      fetchUrl.searchParams.append(key, searchParams[key]);
    });

    let result = null;

    try {
      const response = await fetch(fetchUrl, this.fetchOptions);
      result = await response.json(); // Here you have the data that you need
    } catch (error) {
      alert(
        "Error receiving a response from the server. Please try again later..."
      );
      console.log(error);
    }

    const optionsWrapper = this.select.querySelector(
      this.#oprionsWrapperSelector
    );

    const newOptions = this.formattingOptions(result);

    if (newOptions.length < searchParams.limit) {
      this.reachedLimit = true;
    }

    if (newOptions.length == 0) {
      optionsWrapper.innerHTML = "Names not found. :(";
      this.#endLoading();
      return;
    }

    if (reset || !this.#loadedOptions.length) {
      this.#loadedOptions = newOptions;
      const optionsList = this.#loadedOptions
        .slice(0, this.displayedOptions)
        .map((o) => {
          const listItem = document.createElement("li");
          listItem.textContent = o.label;
          listItem.dataset.value = o.value;
          listItem.setAttribute("tabindex", "0");
          return listItem;
        });

      optionsWrapper.innerHTML = "";
      optionsWrapper.append(...optionsList);
    } else {
      this.#loadedOptions.push(...newOptions);
    }

    if (!this.#optionHeight && optionsWrapper.querySelector("li")) {
      this.#optionHeight = optionsWrapper
        .querySelector("li")
        .getBoundingClientRect().height;
    }

    this.#lastWhere = searchParams.where;

    this.#endLoading();
  };

  get #scrollTop() {
    const list = this.select.querySelector(this.#oprionsWrapperSelectorHigh);
    const { scrollTop } = list;
    return scrollTop;
  }

  #showingOptions = () => {
    const scrollTop = this.#scrollTop;
    if (this.#lastScrollTop == scrollTop) return;
    this.#lastScrollTop = scrollTop;
    const scrollHeight = this.#loadedOptions.length * this.#optionHeight; // Full haight PX
    const listHeight = this.displayedOptions * this.#optionHeight; // List haigth PX
    const half = listHeight / 2; // Options half PX
    let topBlockHeight = 0; // Height in PX
    let offsetOps = 0; // Array offset in unit

    console.log("scrollHeight", scrollTop, half);

    if (scrollTop > half) {
      offsetOps = Math.round((scrollTop - half) / this.#optionHeight);
      topBlockHeight = scrollTop - half;
    }

    let bottomBlockHeight =
      scrollTop + listHeight < scrollHeight
        ? scrollHeight - (listHeight + topBlockHeight)
        : 0; // Height in PX

    let nextOps = offsetOps + this.displayedOptions; // Array offset in unit

    this.#updateList(
      offsetOps,
      nextOps,
      topBlockHeight,
      bottomBlockHeight,
      scrollHeight
    );

    console.log(
      "scroll status: ",
      offsetOps, // +
      nextOps, // +
      topBlockHeight, // +
      bottomBlockHeight, // +
      scrollTop,
      scrollHeight
      // this.#loadedOptions.slice(offsetOpt, nextOps)
    );
  };

  #updateList = (
    offsetOps,
    nextOps,
    topBlockHeight,
    bottomBlockHeight,
    scrollHeight
  ) => {
    const optionsWrapper = this.select.querySelector(
      this.#oprionsWrapperSelector
    );

    const optionsList = this.#loadedOptions
      .slice(offsetOps, nextOps)
      .map((o) => {
        const listItem = document.createElement("li");
        listItem.textContent = o.label;
        listItem.dataset.value = o.value;
        listItem.setAttribute("tabindex", "0");
        return listItem;
      });

    optionsWrapper.innerHTML = "";
    optionsWrapper.append(...optionsList);

    this.select.querySelector(
      this.#oprionsWrapperSelectorHigh
    ).style.height = `${scrollHeight}px`;
    this.select.querySelector(
      this.#optionsHelperTop
    ).style.height = `${topBlockHeight}px`;
    this.select.querySelector(
      this.#optionsHelperBot
    ).style.height = `${bottomBlockHeight}px`;
    console.log("updateList called");
  };
}

window.onload = () => {
  window.select = new Select({
    selectWrapper: document.querySelector(".js-names-select"),
    fetchUrl: "https://parseapi.back4app.com/classes/Complete_List_Names",
    fetchOptions: {
      headers: {
        "X-Parse-Application-Id": "zsSkPsDYTc2hmphLjjs9hz2Q3EXmnSxUyXnouj1I", // This is the fake app's application id
        "X-Parse-Master-Key": "4LuCXgPPXXO2sU5cXm6WwpwzaKyZpo3Wpj4G4xXK", // This is the fake app's readonly master key
      },
    },
    defaultSearchParams: {
      limit: 400,
      order: "Name",
      excludeKeys: "Genre",
    },
    searchParameter: "Name",
    displayedOptions: 100,
    formattingOptions: (result) => {
      if (!result || !result.results || !result.results.length) {
        return [];
      }
      return result.results.map((o) => ({ label: o.Name, value: o.objectId }));
    },
  });
  window.select.init();
};
