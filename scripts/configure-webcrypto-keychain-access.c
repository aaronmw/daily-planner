#include <CoreFoundation/CoreFoundation.h>
#include <Security/Security.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

static void print_status(const char *operation, OSStatus status) {
    CFStringRef message = SecCopyErrorMessageString(status, NULL);
    if (message) {
        char buffer[512];
        if (CFStringGetCString(
                message,
                buffer,
                sizeof(buffer),
                kCFStringEncodingUTF8
            )) {
            fprintf(stderr, "%s: %s (%d)\n", operation, buffer, status);
        } else {
            fprintf(stderr, "%s failed with status %d\n", operation, status);
        }
        CFRelease(message);
        return;
    }

    fprintf(stderr, "%s failed with status %d\n", operation, status);
}

static bool has_authorization(SecACLRef acl, CFStringRef authorization) {
    CFArrayRef authorizations = SecACLCopyAuthorizations(acl);
    if (!authorizations) return false;

    bool contains = CFArrayContainsValue(
        authorizations,
        CFRangeMake(0, CFArrayGetCount(authorizations)),
        authorization
    );
    CFRelease(authorizations);
    return contains;
}

static OSStatus find_webcrypto_item(
    SecKeychainRef keychain,
    const char *account,
    SecKeychainItemRef *item
) {
    return SecKeychainFindGenericPassword(
        keychain,
        0,
        NULL,
        (UInt32)strlen(account),
        account,
        NULL,
        NULL,
        item
    );
}

static OSStatus copy_only_decrypt_acl(
    SecAccessRef access,
    CFArrayRef *acl_list,
    SecACLRef *decrypt_acl
) {
    OSStatus status = SecAccessCopyACLList(access, acl_list);
    if (status != errSecSuccess) return status;

    CFIndex decrypt_acl_count = 0;
    CFIndex count = CFArrayGetCount(*acl_list);
    for (CFIndex index = 0; index < count; index++) {
        SecACLRef acl = (SecACLRef)CFArrayGetValueAtIndex(*acl_list, index);
        if (!has_authorization(acl, kSecACLAuthorizationDecrypt)) continue;
        decrypt_acl_count++;
        *decrypt_acl = acl;
    }

    if (decrypt_acl_count != 1) return errSecDuplicateItem;
    return errSecSuccess;
}

static OSStatus verify_persisted_decrypt_access(
    SecKeychainRef keychain,
    const char *account
) {
    SecKeychainItemRef persisted_item = NULL;
    OSStatus status = find_webcrypto_item(keychain, account, &persisted_item);
    if (status != errSecSuccess) return status;

    SecAccessRef persisted_access = NULL;
    status = SecKeychainItemCopyAccess(persisted_item, &persisted_access);
    if (status != errSecSuccess) {
        CFRelease(persisted_item);
        return status;
    }

    CFArrayRef acl_list = NULL;
    SecACLRef decrypt_acl = NULL;
    status = copy_only_decrypt_acl(
        persisted_access,
        &acl_list,
        &decrypt_acl
    );

    CFArrayRef applications = NULL;
    CFStringRef description = NULL;
    SecKeychainPromptSelector selector = 0;
    if (status == errSecSuccess) {
        status = SecACLCopyContents(
            decrypt_acl,
            &applications,
            &description,
            &selector
        );
    }

    if (
        status == errSecSuccess &&
        (
            applications == NULL ||
            CFArrayGetCount(applications) != 1 ||
            (selector & kSecKeychainPromptRequirePassphase) != 0
        )
    ) {
        status = errSecAuthFailed;
    }

    if (applications) CFRelease(applications);
    if (description) CFRelease(description);
    if (acl_list) CFRelease(acl_list);
    CFRelease(persisted_access);
    CFRelease(persisted_item);
    return status;
}

int main(int argc, const char *argv[]) {
    if (argc != 4) {
        fprintf(
            stderr,
            "Usage: %s <keychain-account> <app-path> <login-keychain>\n",
            argv[0]
        );
        return 64;
    }

    SecKeychainRef keychain = NULL;
    OSStatus status = SecKeychainOpen(argv[3], &keychain);
    if (status != errSecSuccess) {
        print_status("Opening the login Keychain", status);
        return 1;
    }

    SecKeychainItemRef item = NULL;
    status = find_webcrypto_item(keychain, argv[1], &item);
    if (status == errSecItemNotFound) {
        puts(
            "Daily Planner WebCrypto Keychain item does not exist yet; "
            "leaving it unchanged."
        );
        CFRelease(keychain);
        return 0;
    }
    if (status != errSecSuccess) {
        print_status("Finding the Daily Planner WebCrypto Keychain item", status);
        CFRelease(keychain);
        return 1;
    }

    SecAccessRef access = NULL;
    status = SecKeychainItemCopyAccess(item, &access);
    if (status != errSecSuccess) {
        print_status("Reading Daily Planner WebCrypto access", status);
        CFRelease(item);
        CFRelease(keychain);
        return 1;
    }

    CFArrayRef acl_list = NULL;
    SecACLRef decrypt_acl = NULL;
    status = copy_only_decrypt_acl(access, &acl_list, &decrypt_acl);

    SecTrustedApplicationRef trusted_app = NULL;
    if (status == errSecSuccess) {
        status = SecTrustedApplicationCreateFromPath(argv[2], &trusted_app);
    }

    CFArrayRef trusted_apps = NULL;
    if (status == errSecSuccess) {
        const void *trusted_values[] = {trusted_app};
        trusted_apps = CFArrayCreate(
            NULL,
            trusted_values,
            1,
            &kCFTypeArrayCallBacks
        );
        if (!trusted_apps) status = errSecAllocate;
    }

    CFArrayRef existing_applications = NULL;
    CFStringRef description = NULL;
    SecKeychainPromptSelector selector = 0;
    if (status == errSecSuccess) {
        status = SecACLCopyContents(
            decrypt_acl,
            &existing_applications,
            &description,
            &selector
        );
    }

    if (status == errSecSuccess) {
        selector &= ~kSecKeychainPromptRequirePassphase;
        status = SecACLSetContents(
            decrypt_acl,
            trusted_apps,
            description,
            selector
        );
    }

    if (status == errSecSuccess) {
        status = SecKeychainItemSetAccess(item, access);
    }

    if (existing_applications) CFRelease(existing_applications);
    if (description) CFRelease(description);
    if (trusted_apps) CFRelease(trusted_apps);
    if (trusted_app) CFRelease(trusted_app);
    if (acl_list) CFRelease(acl_list);
    CFRelease(access);
    CFRelease(item);

    if (status == errSecSuccess) {
        status = verify_persisted_decrypt_access(keychain, argv[1]);
    }
    CFRelease(keychain);

    if (status != errSecSuccess) {
        print_status("Persisting Daily Planner WebCrypto access", status);
        return 1;
    }

    puts(
        "Persisted password-free WebCrypto access for the installed "
        "Daily Planner app."
    );
    return 0;
}
