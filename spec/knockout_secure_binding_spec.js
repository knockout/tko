describe("Knockout Secure Binding", function () {
    it("Has loaded knockout", function () {
        assert.property(window, 'ko')
    })
    it("secureBindingsProvider exist on 'ko'", function () {
        // note that it could alternatively be exported with `require`
        assert.property(ko, 'secureBindingsProvider')
    })
})
