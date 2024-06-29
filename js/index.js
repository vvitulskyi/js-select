class Select {
  constructor({
    selectWrapper,
    fetchUrl,
    defaultSearchParams,
    searchParameter,
    onChange,
  }) {
    this.oprionsWrapperSelector = ".js-select-options";
    this.inputSelector = ".js-search-input-wrapper input[type=text]";
    this.chevronSelector = ".js-chevron";

    this.select = selectWrapper;
    this.url = fetchUrl;
    this.defaultSearchParams = defaultSearchParams;
    this.searchParameter = searchParameter;
    this.onChange = onChange;

    this.skip = 0;
    this.loading = false;
    this.reachedLimit = false;
    this.searchTimeout = null;
    this.selectedOption = null;
    this.previousSearch = "";
  }

  get value() {
    return this.selectedOption;
  }

  init = () => {
    this.#fetchData(this.defaultSearchParams);
    this.addEvents();
  };

  addEvents = () => {
    this.select.addEventListener("keydown", this.#keyDownHandler);

    this.select.addEventListener("focusin", this.#focusInHandler);
    this.select.addEventListener("focusout", this.#focusOutHandler);

    this.select
      .querySelector(".js-chevron")
      .addEventListener("click", this.#toggleList);

    this.select
      .querySelector(this.inputSelector)
      .addEventListener("input", this.#changeInputHandler);

    this.select
      .querySelector(this.oprionsWrapperSelector)
      .addEventListener("scroll", this.#scrollOptionsListHandler);

    this.select
      .querySelector(this.oprionsWrapperSelector)
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
      .querySelector(this.inputSelector)
      .removeEventListener("input", this.#changeInputHandler);

    this.select
      .querySelector(this.oprionsWrapperSelector)
      .removeEventListener("scroll", this.#scrollOptionsListHandler);

    this.select
      .querySelector(this.oprionsWrapperSelector)
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
        `${this.oprionsWrapperSelector} .selected`
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
            .querySelector(this.oprionsWrapperSelector)
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
    if (e.target != this.select.querySelector(this.chevronSelector)) {
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
    this.skip = 0;
    this.reachedLimit = false;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
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

  #scrollOptionsListHandler = () => {
    if (this.#isScrolledToEnd() && !this.loading) {
      this.skip += this.defaultSearchParams.limit;
      const whereParam = this.#getWhereParam();
      this.#fetchData({
        ...this.defaultSearchParams,
        skip: this.skip,
        ...(whereParam ? { where: whereParam } : null),
      });
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
      this.select.querySelector(this.inputSelector).value !=
        this.selectedOption.label
    ) {
      this.select.querySelector(this.inputSelector).value =
        this.selectedOption.label;
    }
  };

  #isScrolledToEnd = () => {
    const list = this.select.querySelector(this.oprionsWrapperSelector);
    return list.scrollTop + list.clientHeight * 3 > list.scrollHeight;
  };

  #nextFocus = (next, e) => {
    if (!next) {
      this.select.querySelector(this.inputSelector).focus();
      return;
    }
    next.focus();
  };

  #getWhereParam() {
    const inputVal = this.select.querySelector(this.inputSelector).value;
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
    this.select.classList.remove("opened");
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

    try {
      this.#startLoading();
      const url = new URL(this.url);

      Object.keys(searchParams).forEach((key) => {
        url.searchParams.append(key, searchParams[key]);
      });

      const response = await fetch(url, {
        headers: {
          "X-Parse-Application-Id": "zsSkPsDYTc2hmphLjjs9hz2Q3EXmnSxUyXnouj1I", // This is the fake app's application id
          "X-Parse-Master-Key": "4LuCXgPPXXO2sU5cXm6WwpwzaKyZpo3Wpj4G4xXK", // This is the fake app's readonly master key
        },
      });
      const { results } = await response.json(); // Here you have the data that you need

      const optionsWrapper = this.select.querySelector(
        this.oprionsWrapperSelector
      );

      if (results.length < searchParams.limit) {
        this.reachedLimit = true;
      }

      if (results.length == 0) {
        optionsWrapper.innerHTML = "Names not found. :(";
        this.#endLoading();
        return;
      }

      const optionsList = results.map((o) => {
        const listItem = document.createElement("li");
        listItem.textContent = o[this.searchParameter];
        listItem.dataset.value = o.objectId;
        listItem.setAttribute("tabindex", "0");
        return listItem;
      });

      if (reset) {
        optionsWrapper.innerHTML = "";
      }

      optionsWrapper.append(...optionsList);
      this.#endLoading();
    } catch (error) {
      alert(
        "Error receiving a response from the server. Please try again later..."
      );
      console.log(error);
    }
  };
}

window.onload = () => {
  const select = new Select({
    selectWrapper: document.querySelector(".js-names-select"),
    fetchUrl: "https://parseapi.back4app.com/classes/Complete_List_Names",
    defaultSearchParams: {
      limit: 100000,
      order: "Name",
      excludeKeys: "Genre",
    },
    searchParameter: "Name",
    onChange: (option) => {
      console.log(option);
    },
  });
  select.init();
};
