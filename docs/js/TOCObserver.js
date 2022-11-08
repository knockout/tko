export class TOCObserver {
  #links
  #sections
  #observer
  #visibleSections = new Set()

  constructor (links, sections) {
    this.#links = Array.from(links)
    this.#sections = Array.from(sections)
    this.#visibleSections = new Set()
    this.#observer = new IntersectionObserver(this.onIntersection.bind(this), {
      rootMargin: '-30% 0 -30% 0'
    })
    for (const s of sections) {
      this.#observer.observe(s)
    }
  }

  onIntersection (entries, observer) {
    for (const e of entries) {
      if (e.isIntersecting) {
        this.#visibleSections.add(e.target)
      } else {
        this.#visibleSections.delete(e.target)
      }
    }

    // activate the first section that's visible
    const activeSection = this.#sections.find(s => this.#visibleSections.has(s))
    activeSection ||= this.#sections[0]
    const hash = '#' + activeSection.id

    for (const l of this.#links) {
      l.classList.toggle('active', l.hash === hash)
    }
  }
}
