
describe("Build behaviour", function() {
	it('Should be aliased as ko.unwrap', function() {
	    expect(ko.unwrap).toBe(ko.utils.unwrapObservable);
		expect(ko.unwrap).toBe(ko.utils.unwrapObservable);
	    expect(ko.unwrap(ko.observable('some value'))).toBe('some value');
		expect(ko.unwrap(ko.observable('some value'))).toBe('some value');
    });
});
